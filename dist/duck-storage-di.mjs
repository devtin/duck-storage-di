/*!
 * duck-storage-di v1.0.5
 * (c) 2020-2021 Martin Rafael Gonzalez <tin@devtin.io>
 * MIT
 */
import { pleasureDi } from 'pleasure-di';
import { jsDirIntoJson } from 'js-dir-into-json';
import { DuckStorageClass, Duck, DuckRack, Duckfficer } from 'duck-storage';
import { readdirSync, existsSync, lstatSync } from 'fs';
import path from 'path';
import startCase from 'lodash/startCase';
import Promise from 'bluebird';

const { Schema } = Duckfficer;

const loaderExtensions = ['!__tests__', '!*.unit.js', '!*.spec.js', '!*.test.js', '*.js', '*.mjs'];

const upperCamelCase = (s) => {
  return startCase(s).replace(/[\s]+/g, '')
};

const isDir = (givenPath) => {
  if (!existsSync(givenPath)) {
    return false
  }

  return lstatSync(givenPath).isDirectory()
};

const all = (arr, cb) => {
  const arrOfPromises = arr.map((value) => cb(value));
  return Promise.all(arrOfPromises)
};

const injectContainerInMethods = (container, methods) => {
  Object.entries(methods||{}).forEach(([, method]) => {
    method.handler = method.handler(container);
  });

  return methods
};

const loadRacks = async ({
  dir,
  racksNames,
  modelPath = 'model',
  methodsPath = 'methods',
  container
}) => {
  const Racks = {};

  await all(racksNames, async (rackName) => {
    const duckRackModelPath = path.join(dir, rackName, modelPath);
    const duckRackMethodsPath = path.join(dir, rackName, methodsPath);

    const duckData = await jsDirIntoJson(duckRackModelPath, { extensions: loaderExtensions });
    const duckRackMethods = isDir(duckRackMethodsPath) ? await jsDirIntoJson(duckRackMethodsPath, { extensions: loaderExtensions }) : undefined;

    const duckModel = new Duck({
      schema: duckData.schema instanceof Schema ? duckData.schema : new Schema(duckData.schema, { methods: injectContainerInMethods(container, duckData.methods) })
    });

    Racks[upperCamelCase(rackName)] = await new DuckRack(rackName, { duckModel, methods: injectContainerInMethods(container, duckRackMethods) });
  });

  return Racks
};

const getAvailableRacks = (directory) => {
  return readdirSync(directory)
    .filter((childDirectory) => isDir(path.join(directory, childDirectory)))
};

const getResolvers = async (directory, {
  baseDir,
  suffix,
  methodsPath,
  modelPath,
  storageOptions
}) => {
  const racksPath = path.resolve(baseDir, directory);
  const availableRacks = getAvailableRacks(racksPath);
  const removeSuffix = (nameWithSuffix) => {
    const removePattern = new RegExp(`${suffix}$`);
    return nameWithSuffix.replace(removePattern, '')
  };

  const storage = await new DuckStorageClass(storageOptions);

  let racks;

  return {
    storage,
    resolvers: {
      [suffix] (rackName) {
        const rackNameWithoutSuffix = removeSuffix(rackName);
        if (!racks[rackNameWithoutSuffix]) {
          throw new Error(`${suffix}  -> ${rackName} not found`)
        }
        return () => racks[rackNameWithoutSuffix]
      }
    },
    async registerContainer (container) {
      racks = await loadRacks({
        dir: racksPath,
        racksNames: availableRacks,
        methodsPath,
        modelPath,
        container
      });

      // registering racks
      await Promise.each(Object.entries(racks), async ([, rack]) => {
        await storage.registerRack(rack);
      });
    }
  }
};

/**
 *
 * @param {String} directory
 * @param {String} [baseDir=process.cwd()]
 * @param {String} [modelPath=model]
 * @param {String} [methodsPath=methods]
 * @param {String} [suffix=Rack]
 * @param {Object} [storageOptions]
 * @return {{ container, storage }} container and storage
 */
const duckStorageDi = async (directory, {
  baseDir = process.cwd(),
  suffix = 'Rack',
  modelPath = 'model',
  methodsPath = 'methods',
  storageOptions
} = {}) => {
  const { resolvers, registerContainer, storage } = await getResolvers(directory, {
    baseDir,
    suffix,
    modelPath,
    methodsPath,
    storageOptions
  });
  const container = pleasureDi(resolvers);
  await registerContainer(container);
  return { container, storage }
};

export { duckStorageDi, getResolvers };

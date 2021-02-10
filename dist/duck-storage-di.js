/*!
 * duck-storage-di v1.0.3
 * (c) 2020-2021 Martin Rafael Gonzalez <tin@devtin.io>
 * MIT
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var pleasureDi = require('pleasure-di');
var jsDirIntoJson = require('js-dir-into-json');
var duckStorage = require('duck-storage');
var fs = require('fs');
var path = require('path');
var startCase = require('lodash/startCase');
var Promise = require('bluebird');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var startCase__default = /*#__PURE__*/_interopDefaultLegacy(startCase);
var Promise__default = /*#__PURE__*/_interopDefaultLegacy(Promise);

const { Schema } = duckStorage.Duckfficer;

const loaderExtensions = ['!__tests__', '!*.unit.js', '!*.spec.js', '!*.test.js', '*.js', '*.mjs'];

const upperCamelCase = (s) => {
  return startCase__default['default'](s).replace(/[\s]+/g, '')
};

const isDir = (givenPath) => {
  if (!fs.existsSync(givenPath)) {
    return false
  }

  return fs.lstatSync(givenPath).isDirectory()
};

const all = (arr, cb) => {
  const arrOfPromises = arr.map((value) => cb(value));
  return Promise__default['default'].all(arrOfPromises)
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
    const duckRackModelPath = path__default['default'].join(dir, rackName, modelPath);
    const duckRackMethodsPath = path__default['default'].join(dir, rackName, methodsPath);

    const duckData = await jsDirIntoJson.jsDirIntoJson(duckRackModelPath, { extensions: loaderExtensions });
    const duckRackMethods = isDir(duckRackMethodsPath) ? await jsDirIntoJson.jsDirIntoJson(duckRackMethodsPath, { extensions: loaderExtensions }) : undefined;

    const duckModel = new duckStorage.Duck({
      schema: duckData.schema instanceof Schema ? duckData.schema : new Schema(duckData.schema, { methods: injectContainerInMethods(container, duckData.methods) })
    });

    Racks[upperCamelCase(rackName)] = await new duckStorage.DuckRack(rackName, { duckModel, methods: injectContainerInMethods(container, duckRackMethods) });
  });

  return Racks
};

const getAvailableRacks = (directory) => {
  return fs.readdirSync(directory)
    .filter((childDirectory) => isDir(path__default['default'].join(directory, childDirectory)))
};

const getResolvers = async (directory, {
  baseDir,
  suffix,
  methodsPath,
  modelPath,
  storageOptions
}) => {
  const availableRacks = getAvailableRacks(directory);
  const removeSuffix = (nameWithSuffix) => {
    const removePattern = new RegExp(`${suffix}$`);
    return nameWithSuffix.replace(removePattern, '')
  };

  const storage = await new duckStorage.DuckStorageClass(storageOptions);

  let racks;

  return {
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
        dir: path__default['default'].resolve(baseDir, directory),
        racksNames: availableRacks,
        methodsPath,
        modelPath,
        container
      });

      // registering racks
      await Promise__default['default'].each(Object.entries(racks), async ([, rack]) => {
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
 * @return {Object} container
 */
const duckStorageDi = async (directory, {
  baseDir = process.cwd(),
  suffix = 'Rack',
  modelPath = 'model',
  methodsPath = 'methods',
  storageOptions
} = {}) => {
  const { resolvers, registerContainer } = await getResolvers(directory, {
    baseDir,
    suffix,
    modelPath,
    methodsPath,
    storageOptions
  });
  const container = pleasureDi.pleasureDi(resolvers);
  await registerContainer(container);
  return container
};

exports.duckStorageDi = duckStorageDi;
exports.getResolvers = getResolvers;

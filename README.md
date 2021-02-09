<div><h1>duck-storage-di</h1></div>

<p>
    <a href="https://www.npmjs.com/package/duck-storage-di" target="_blank"><img src="https://img.shields.io/npm/v/duck-storage-di.svg" alt="Version"></a>
<a href="http://opensource.org/licenses" target="_blank"><img src="http://img.shields.io/badge/License-MIT-brightgreen.svg"></a>
</p>

<p>
    loads duck-storage entities from a path to provide a pleasure-di container
</p>

## Installation

```sh
$ npm i duck-storage-di --save
# or
$ yarn add duck-storage-di
```

## Features

- [Loads entities from directory](#loads-entities-from-directory)
- [Loads methods](#loads-methods)


<a name="loads-entities-from-directory"></a>

## Loads entities from directory


```js
const { CustomerRack } = container
const customerData = {
  firstName: 'Martin',
  lastName: 'Gonzalez',
  email: 'tin@devtin.io',
  phoneNumber: 3051234567
}
const customer = await CustomerRack.create(customerData)
t.like(customer, customerData)
t.truthy(customer._id)
t.truthy(customer._v)
```

<a name="loads-methods"></a>

## Loads methods


```js
const { CustomerRack } = container

const doc = await CustomerRack.create({
  firstName: 'Martin',
  lastName: 'Gonzalez',
  email: 'tin@devtin.io',
  phoneNumber: 3051234567
})

let eventReceived

CustomerRack.on('method', (payload) => {
  eventReceived = payload
})

const newDoc = await CustomerRack.apply({ id: doc._id, _v: doc._v, method: 'addLog', payload: 'message' })
t.truthy(newDoc)
t.truthy(newDoc.entryResult)
t.truthy(newDoc.eventsDispatched)
t.like(eventReceived, newDoc.eventsDispatched[0])
```


<br><a name="duckStorageDi"></a>

### duckStorageDi(directory, [baseDir], [modelPath], [methodsPath], [suffix], [storageOptions]) ⇒ <code>Object</code>

| Param | Type | Default |
| --- | --- | --- |
| directory | <code>String</code> |  | 
| [baseDir] | <code>String</code> | <code>process.cwd()</code> | 
| [modelPath] | <code>String</code> | <code>model</code> | 
| [methodsPath] | <code>String</code> | <code>methods</code> | 
| [suffix] | <code>String</code> | <code>Rack</code> | 
| [storageOptions] | <code>Object</code> |  | 

**Returns**: <code>Object</code> - container  

* * *

### License

[MIT](https://opensource.org/licenses/MIT)

&copy; 2020-present Martin Rafael Gonzalez <tin@devtin.io>

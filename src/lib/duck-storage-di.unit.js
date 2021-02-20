import test from 'ava'
import path from 'path'
import { plugins } from 'duck-storage'
import { duckStorageDi } from './duck-storage-di.js'

let container

test.before(async () => {
  ({ container } = await duckStorageDi(path.join(__dirname, './__tests__/fixtures'), {
    storageOptions: {
      plugins: [plugins.InMemory()]
    }
  }))
})

test('Loads entities from directory', async (t) => {
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
})

test('Loads methods', async (t) => {
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
})

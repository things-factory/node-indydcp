import { expect } from 'chai'
import Struct from 'struct'

var Person = Struct() // test
  .chars('firstName', 10)
  .chars('lastName', 10)
  .array('items', 3, 'chars', 10)
  .word16Sle('balance')

const PERSON_LENGTH = 10 + 10 + 3 * 10 + 1 * 2

var People = Struct() // test
  .word8('presentCount')
  .array('list', 2, Person)

describe('Struct', function () {
  describe('simple struct', function () {
    it('should return -1 when the value is not present', async function () {
      var proxyOrigin = Person.allocate().fields
      proxyOrigin.firstName = 'hearty'
      proxyOrigin.lastName = 'oh'

      var bufOrigin = Person.buffer()
      console.log(bufOrigin)
      expect(bufOrigin.length).to.equal(PERSON_LENGTH)

      // new Person Struct
      var bufAllocated = Person.allocate().buffer()

      console.log(bufAllocated)
      Person._setBuff(bufOrigin)
      var proxyAllocated = Person.fields

      expect(proxyAllocated.firstName).to.equal('hearty')
      expect(proxyAllocated.lastName).to.equal('oh')
    })
  })

  describe('embedded struct', function () {
    it('should return -1 when the value is not present', async function () {
      People.allocate()
      var buf = People.buffer()

      console.log(buf)

      var proxy = People.fields
      proxy.presentCount = 2
      proxy.list[0].firstName = 'shnam'
      console.log(buf)
      //   expect(decorated.executed).to.be.true
      //   expect(decorated.lockcount).to.equal(1)
      //   expect(decorated.releasecount).to.equal(1)
    })
  })
})

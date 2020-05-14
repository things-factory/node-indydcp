import { expect } from 'chai'
import { getErrorString, ErrorCode } from '../../src/error-code'

describe('ErrorCode', function () {
  describe('getErrorString(ErrorCode.ERR_NONE)', function () {
    it('should return "No Error"', function () {
      expect(getErrorString(ErrorCode.ERR_NONE)).to.equal('No Error')
    })
  })

  describe('getErrorString(ErrorCode.ERR_OVER_DATA_SIZE)', function () {
    it('should return "Over data size"', function () {
      expect(getErrorString(ErrorCode.ERR_OVER_DATA_SIZE)).to.equal('Over data size')
    })
  })

  describe('getErrorString(-1)', function () {
    it('should return "None"', function () {
      expect(getErrorString(-1)).to.equal('None')
    })
  })
})

import { expect } from 'chai'
import { err_to_string, ErrorCode } from '../../src/error-code'

describe('ErrorCode', function () {
  describe('err_to_string(ErrorCode.ERR_NONE)', function () {
    it('should return "No Error"', function () {
      expect(err_to_string(ErrorCode.ERR_NONE)).to.equal('No Error')
    })
  })

  describe('err_to_string(ErrorCode.ERR_OVER_DATA_SIZE)', function () {
    it('should return "Over data size"', function () {
      expect(err_to_string(ErrorCode.ERR_OVER_DATA_SIZE)).to.equal('Over data size')
    })
  })

  describe('err_to_string(-1)', function () {
    it('should return "None"', function () {
      expect(err_to_string(-1)).to.equal('None')
    })
  })
})

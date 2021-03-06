import { expect } from 'chai'
import { ROBOT_IP, ROBOT_NAME } from '../settings'
import { EndToolType } from '../../src/const'
import { IndyDCPClient } from '../../src/dcp-client'
import { sleep } from '../../src/utils'

describe('IndyDCPClient', function () {
  describe('#getEndtoolDO()', function () {
    this.timeout(10000)

    it('should return binary string', async () => {
      var client = new IndyDCPClient(ROBOT_IP, ROBOT_NAME)
      await client.connect()

      var doNPN = await client.getEndtoolDO(EndToolType.NPN)
      console.log('EndTool NPN : ', doNPN)

      client.disconnect()
    })
  })

  describe('#setEndtoolDO()', function () {
    this.timeout(10000)

    it('should return binary string', async () => {
      var client = new IndyDCPClient(ROBOT_IP, ROBOT_NAME)
      await client.connect()

      await client.setEndtoolDO(EndToolType.NPN, true)
      var doNPN = await client.getEndtoolDO(EndToolType.NPN)
      console.log('EndTool NPN : ', doNPN)
      expect(doNPN).to.be.true

      await client.setEndtoolDO(EndToolType.PNP, true)
      var doPNP = await client.getEndtoolDO(EndToolType.PNP)
      console.log('EndTool PNP : ', doPNP)
      expect(doPNP).to.be.true

      // await client.setEndtoolDO(EndToolType.NoUse, true)
      // var doNoUse = await client.getEndtoolDO(EndToolType.NoUse)
      // console.log('EndTool NoUse : ', doNoUse)
      // expect(doNoUse).to.be.true

      await client.setEndtoolDO(EndToolType.eModi, true)
      var doeModi = await client.getEndtoolDO(EndToolType.eModi)
      console.log('EndTool eModi : ', doeModi)
      expect(doeModi).to.be.true

      client.disconnect()
    })
  })
})

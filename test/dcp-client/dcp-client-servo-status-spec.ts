import { expect } from 'chai'
import { IndyDCPClient } from '../../src/dcp-client'
import { sleep } from '../../src/utils'

describe('IndyDCPClient', function () {
  describe('#get_servo_state()', function () {
    this.timeout(10000)

    it('should return binary string', async () => {
      var client = new IndyDCPClient('192.168.1.207', 'NRMK-Indy7')
      await client.connect()

      var state: any = await client.get_servo_state()
      console.log('Servo: ', state.servoState)
      console.log('Brake: ', state.brakeState)

      console.log('Turn off joint 6th servo')
      state = await client.set_servo([true, true, true, true, true, false])

      var state: any = await client.get_servo_state()
      console.log('Servo: ', state.servoState)
      console.log('Brake: ', state.brakeState)

      await sleep(1000)

      console.log('Turn on joint 6th servo')
      await client.set_servo([true, true, true, true, true, true])

      var state: any = await client.get_servo_state()
      console.log('Servo: ', state.servoState)
      console.log('Brake: ', state.brakeState)

      await sleep(1000)

      console.log('Turn on joint 6th brake')
      await client.set_brake([true, false, false, false, false, true])

      state = await client.get_servo_state()
      console.log('Brake: ', state.brakeState)

      await sleep(1000)

      // console.log('Turn off joint 6th brake')
      await client.set_brake([false, false, false, false, false, false])

      state = await client.get_servo_state()
      console.log('Brake: ', state.brakeState)

      await sleep(1000)

      await client.getRobotStatus()
      console.log(client.robotStatus)

      client.disconnect()
    })
  })
})

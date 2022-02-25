const { IndyDCPClient, sleep } = require('@things-factory/node-indydcp')

async function waitForState(client, checkFn) {
  var robotStatus = await client.getRobotStatus()
  while (!checkFn(robotStatus)) {
    await sleep(1000)
    robotStatus = await client.getRobotStatus()
  }
}

;(async function () {
  var client = new IndyDCPClient('192.168.0.111', 'NRMK-Indy7')
  await client.connect()

  console.log(await client.getSmartDIs())
  console.log(await client.getSmartDI(0))

  // await client.goHome()
  // console.log(await client.getRobotStatus())

  // await waitForState(client, status => !status.isBusy)

  // await client.goZero()
  // console.log(await client.getRobotStatus())

  // await waitForState(client, status => !status.isBusy)

  client.disconnect()
})()

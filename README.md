# @things-factory/node-indydcp

IndyDCP client module for nodejs.

[IndyDCP](http://docs.neuromeka.com/2.3.0/en/IndyDCP/section1/) bindings for Node.js. IndyDCP is a dedicated communication protocol for controlling Neuromeka's Indy robots - by interfacing with it natively in node,

[Hatiolab](http://www.hatiolab.com) is blah blah.
[things-factory]() is blah blah.
we get powerful automation in js.

- [Provided by hatiolab](https://www.youtube.com/playlist?list=PLrcYC3lASr3spRCJIRYqfm3axhMMEoimP)
- [Operato Tutorials](https://www.youtube.com/playlist?list=PLrcYC3lASr3sXZNC6e-6J-dRoPB2-Efo-)
- [Things Board Tutorials](https://www.youtube.com/playlist?list=PLrcYC3lASr3sFvDlSaHRhTgIDSZ4c3KhO)

People are using @things-factory/node-indydcp to fry whole chickens with robots, make coffee or bubble tea, and sort apples and pears.
If you're using it for something cool, I'd love to hear about it!

You'll need Neuromeka's Indy robot, first.;-)

## Install

```bash
$ npm install @things-factory/node-indydcp --save
```

## Examples

Run the examples from the examples directory.

### Moving Robot Arm

```javascript
const { IndyDCPClient, sleep } = require('@things-factory/node-indydcp')

async function waitForState(client, checkFn) {
  var robotStatus = await client.getRobotStatus()
  while (!checkFn(robotStatus)) {
    await sleep(1000)
    robotStatus = await client.getRobotStatus()
  }
}

;(async function () {
  var client = new IndyDCPClient('192.168.1.207', 'NRMK-Indy7')
  await client.connect()

  await client.goHome()
  console.log(await client.getRobotStatus())

  await waitForState(client, status => !status.isBusy)

  await client.goZero()
  console.log(await client.getRobotStatus())

  await waitForState(client, status => !status.isBusy)

  client.disconnect()
})()
```

## API Documentation

...

## Test

`npm test`.

## Contributing

I'm happy to accept most PR's if the tests run
green, all new functionality is tested, and there are no objections in the PR.

## MIT License

The library is distributed under the MIT License - if for some reason that
doesn't work for you please get in touch.

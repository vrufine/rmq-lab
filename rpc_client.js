const uuid = require('uuid/v4')
const amqp = require('amqplib/callback_api')
const args = process.argv.slice(2)

if (args.length === 0) {
  console.log(' = Como usar: node rpc_client.js <numero>')
  process.exit(0)
}

amqp.connect('amqp://localhost:5672', (err, conn) => {
  if (err) console.log(err)
  conn.createChannel((err2, ch) => {
    if (err2) console.log(err2)
    ch.assertQueue('', { exclusive: true }, (err3, q) => {
      if (err3) console.log(err3)
      const corr = uuid()
      const num = parseInt(args[0])
      console.log(` = Solicitando fibonacci(${num})`)
      ch.consume(q.queue, (msg) => {
        if (msg.properties.correlationId === corr) {
          console.log(` = Resposta recebida: ${msg.content.toString()}`)
          setTimeout(() => { conn.close(); process.exit(0) }, 500)
        }
      }, { noAck: true })
      ch.sendToQueue(
        'rpc_queue',
        Buffer.from(num.toString()),
        { correlationId: corr, replyTo: q.queue }
      )
    })
  })
})

use aiken/hash.{Blake2b_224, Hash} 
use aiken/list
use aiken/string
use aiken/transaction.{ScriptContext}
use aiken/transaction/credential.{VerificationKey}
 

type Datum {
  owner: Hash<Blake2b_224, VerificationKey>
}

type Redeemer {
  message: ByteArray
}

validator {
  fn hello_world(datum: Datum, redeemer: Redeemer, context: ScriptContext) -> Bool{
    
    let must_say_hello = redeemer.message == "Hello world!"
    trace string.from_bytearray(redeemer.message)
    let must_be_signed = list.has(context.transaction.extra_signatories, datum.owner)
    must_say_hello? && must_be_signed?

  }
}





// type Datum {
//   owner: Hash<Blake2b_224, VerificationKey>,
// }
 
// type Redeemer {
//   msg: ByteArray,
// }
 
// validator {
//   fn hello_world(datum: Datum, redeemer: Redeemer, context: ScriptContext) -> Bool {
//     let must_say_hello =
//       redeemer.msg == "Hello, World!"
 
//     let must_be_signed =
//       list.has(context.transaction.extra_signatories, datum.owner)
 
//     must_say_hello && must_be_signed
//   }
// }
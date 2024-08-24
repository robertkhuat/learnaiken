import {
  Blockfrost,
  Data,
  Lucid,
  SpendingValidator,
  TxHash,
  fromHex,
  toHex,
  utf8ToHex,
  Redeemer,
  UTxO,
  Constr,
} from "https://deno.land/x/lucid@0.8.3/mod.ts";
import * as cbor from "https://deno.land/x/cbor@v1.4.1/index.js";

const lucid = await Lucid.new(
  new Blockfrost(
    "https://cardano-preview.blockfrost.io/api/v0",
    "previewvdfpeljxC5AG1D0Efw05rCCMLMl1juyx"
  ),
  "Preview"
);

lucid.selectWalletFromSeed(await Deno.readTextFile("./owner.seed"));

async function readValidator(): Promise<SpendingValidator> {
  const validator = JSON.parse(await Deno.readTextFile("plutus.json"))
    .validators[0];
  return {
    type: "PlutusV2",
    script: toHex(cbor.encode(fromHex(validator.compiledCode))),
  };
}

const publicKeyHash = lucid.utils.getAddressDetails(
  await lucid.wallet.address()
).paymentCredential?.hash;

const Datum = Data.Object({
  owner: Data.String,
});

type Datum = Data.Static<typeof Datum>;

async function unlockAssests(
  utxos: UTxO[],
  { validator, redeemer }: { validator: SpendingValidator; redeemer: Redeemer }
): Promise<TxHash> {
  const tx = await lucid
    .newTx()
    .collectFrom(utxos, redeemer)
    .addSigner(await lucid.wallet.address())
    .attachSpendingValidator(validator)
    .complete();

  const signedTx = await tx.sign().complete();

  return signedTx.submit();
}

async function main() {
  const validator = await readValidator();

  const scriptAddress = lucid.utils.validatorToAddress(validator);

  const scriptUTxOs = await lucid.utxosAt(scriptAddress);

  const utxos = scriptUTxOs.filter((utxo) => {
    try {
      const temp = Data.from<Datum>(utxo.datum ?? "", Datum);
      if (temp.owner === publicKeyHash) {
        return true;
      }
      return false;
    } catch (e) {
      console.log(e);
      return false;
    }
  });

  const redeemer = Data.to(new Constr(0, [utf8ToHex("Hello world!")]));

  const txHash = await unlockAssests(utxos, { validator, redeemer });

  await lucid.awaitTx(txHash);

  console.log(`tx hash: ${txHash}
                redeemer: ${redeemer}
    `);
}

main();

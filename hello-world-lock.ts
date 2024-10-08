import {
  Blockfrost,
  Data,
  Lucid,
  SpendingValidator,
  TxHash,
  fromHex,
  toHex,
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
    .validator[0];
  return {
    type: "PlutusV2",
    script: toHex(cbor.encode(fromHex(validator.compileCode))),
  };
}

const validator = readValidator();

const publicKeyHash = lucid.utils.getAddressDetails(
  await lucid.wallet.address()
).paymentCredential?.hash;
const Datum = Data.Object({
  owner: Data.string,
});

type Datum = Data.Static<typeof Datum>;

async function lockAssets(
  lovelace: BigInt,
  { validator, datum }: { validator: SpendingValidator; datum: string }
): Promise<TxHash> {
  const contractAddress = lucid.utils.validatorToAddress(validator);

  const tx = await lucid
    .newTx()
    .payToContract(contractAddress, { inline: datum }, { lovelace: lovelace })
    .complete();

  const signedTx = await tx.sign().complete();
  return signedTx.submit();
}

async function main() {
  const validator = readValidator();

  const datum = Data.to<Datum>(
    {
      owner: publicKeyHash,
    },
    Datum
  );

  const txHash = await lockAssets(2000000n, { validator, datum });

  await lucid.awaitTx(txHash);

  console.log(`tx hash: ${txHash}
                datum: ${datum}
    `);
}

main();

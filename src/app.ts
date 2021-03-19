#!/usr/bin/env node

import { stringToPath } from '@cosmjs/crypto';
import { coins, GasPrice, launch } from '@cosmjs/launchpad';
import { DirectSecp256k1HdWallet, Registry } from '@cosmjs/proto-signing';
import {
  assertIsBroadcastTxSuccess,
  SigningStargateClient,
  SigningStargateClientOptions,
  StargateClient,
} from '@cosmjs/stargate';
import { MsgDelegate } from '@cosmjs/stargate/build/codec/cosmos/staking/v1beta1/tx';

const rpcEndpoint = 'http://0.0.0.0:26657';
const prefix = 'emoney';
const mnemonic =
  'play witness auto coast domain win tiny dress glare bamboo rent mule delay exact arctic vacuum laptop hidden siren sudden six tired fragile penalty';
const recipient = 'emoney15qdefkmwswysgg4qxgqpqr35k3m49pkxeyrqj5';
const defaultGasPrice = GasPrice.fromString('1ungm');

export async function main() {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(
    mnemonic,
    stringToPath("m/44'/118'/0'/0/0"),
    'emoney'
  );
  const [firstAccount] = await wallet.getAccounts();
  console.log('sender:', firstAccount.address);
  const signingOptions: SigningStargateClientOptions = {
    gasPrice: defaultGasPrice,
    prefix: prefix,
  };
  const client = await SigningStargateClient.connectWithSigner(
    rpcEndpoint,
    wallet,
    signingOptions
  );

  const amount = {
    denom: 'ungm',
    amount: '1',
  };

  // const msg = MsgDelegate.create({
  //   delegatorAddress: alice.address0,
  //   validatorAddress: validator.validatorAddress,
  //   amount: {
  //     denom: 'uatom',
  //     amount: '1234567',
  //   },
  // });
  // const msgAny = {
  //   typeUrl: msgDelegateTypeUrl,
  //   value: msg,
  // };
  // const result = await client.sendTokens(
  //   firstAccount.address,
  //   recipient,
  //   [amount],
  //   'Have fun with your star coins'
  // );
  const before = await client.getBalance(recipient, 'ungm');
  if (before !== null) {
    console.log(`balance before ${before.amount}${before.denom}`);
  }
  const memo = 'Use your power wisely';
  const result = await client.sendTokens(
    firstAccount.address,
    recipient,
    [amount],
    memo
  );
  assertIsBroadcastTxSuccess(result);
  const after = await client.getBalance(recipient, 'ungm');
  if (after !== null) {
    console.log(`balance after ${after.amount}${after.denom}`);
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  }
);

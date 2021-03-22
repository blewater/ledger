#!/usr/bin/env node

import { stringToPath } from '@cosmjs/crypto';
import { GasPrice, Secp256k1HdWallet } from '@cosmjs/launchpad';
import { LedgerSigner } from '@cosmjs/ledger-amino';
import {
  assertIsBroadcastTxSuccess,
  SigningStargateClient,
  SigningStargateClientOptions,
} from '@cosmjs/stargate';
import TransportNodeHidNE from '@ledgerhq/hw-transport-node-hid-noevents';

// ts hack for improper export of TransportNodeHid class as default
import TransportModule from '../node_modules/@ledgerhq/hw-transport-node-hid/lib/TransportNodeHid.js';
const transport = TransportModule.default;

const rpcEndpoint = 'http://0.0.0.0:26657';
const emoneyPrefix = 'emoney';

// A funded genesis address
const mnemonic =
  'play witness auto coast domain win tiny dress glare bamboo rent mule delay exact arctic vacuum laptop hidden siren sudden six tired fragile penalty';
const defaultLedgerAddress = 'emoney13j6rftqlqrwv0ejkst4y2grq4swvrx5ad7gg45';
const defaultGasPrice = GasPrice.fromString('1ungm');

const hdPath = stringToPath("m/44'/118'/0'/0/0");

async function main() {
  const ledgerSigner = await ledgerConn();

  const wallet = await Secp256k1HdWallet.fromMnemonic(
    mnemonic,
    hdPath,
    emoneyPrefix
  );

  // Get funded address
  const [firstAccount] = await wallet.getAccounts();
  console.log('sender:', firstAccount.address);

  const signingOptions: SigningStargateClientOptions = {
    gasPrice: defaultGasPrice,
    prefix: emoneyPrefix,
  };

  const client = await SigningStargateClient.connectWithSigner(
    rpcEndpoint,
    wallet,
    signingOptions
  );

  const amountToLedgerAddr = {
    denom: 'ungm',
    amount: '85000',
  };

  const before = await client.getBalance(defaultLedgerAddress, 'ungm');
  if (before !== null) {
    console.log(
      `ledger starting balance before ${before.amount}${before.denom}`
    );
  }
  const memo = 'Enjoy your NGM';

  /*************************************************
   * Send to the ledger address from another address
   *************************************************/
  const result = await client.sendTokens(
    firstAccount.address,
    defaultLedgerAddress,
    [amountToLedgerAddr],
    memo
  );
  assertIsBroadcastTxSuccess(result);
  const after = await client.getBalance(defaultLedgerAddress, 'ungm');
  if (after !== null) {
    console.log(
      `balance before ledger account transfer ${after.amount}${after.denom}`
    );
  }

  /**********************************************
   * Send from ledger address to another address
   **********************************************/
  const amountFromLedgerAddr = {
    denom: 'ungm',
    amount: '10',
  };

  const ledgerSigningClient = await SigningStargateClient.connectWithSigner(
    rpcEndpoint,
    ledgerSigner,
    signingOptions
  );

  // const legacyClient = new SigningCosmosClient(rpcEndpoint, firstAccount.address, ledgerSigner);
  const resultFromLedger = await ledgerSigningClient.sendTokens(
    defaultLedgerAddress,
    firstAccount.address,
    [amountFromLedgerAddr],
    'From ledger account'
  );
  assertIsBroadcastTxSuccess(resultFromLedger);

  const afterLedgerTrx = await client.getBalance(defaultLedgerAddress, 'ungm');
  if (afterLedgerTrx !== null) {
    console.log(
      `balance before ledger account transfer ${afterLedgerTrx.amount}${afterLedgerTrx.denom}`
    );
  }
}

async function ledgerConn(): Promise<LedgerSigner> {
  const devs = TransportNodeHidNE.getDevices();
  console.log(devs[0]);
  console.log(devs[0].path);
  const interactiveTimeout = 120_000;

  const ledgerTransp = await transport.create(
    interactiveTimeout,
    interactiveTimeout
  );
  const signer = new LedgerSigner(ledgerTransp, {
    testModeAllowed: true,
    hdPaths: [hdPath],
    prefix: emoneyPrefix,
  });

  const accounts = await signer.getAccounts();
  console.log('Ledger accounts:', accounts.length);
  console.log(accounts[0]);

  return signer;
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  }
);

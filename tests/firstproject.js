const anchor = require("@project-serum/anchor");
const { SystemProgram } = anchor.web3;

const main = async () => {
  console.log("🚀 Starting test...");
  // Need to update provider to communicate with frontend
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Firstproject;
  // Create an account keypair for our program to use.
  const baseAccount = anchor.web3.Keypair.generate();

  // Pass params to function in program
  const tx = await program.rpc.startStuffOff({
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    },
    signers: [baseAccount],
  });
  console.log("📝 Your transaction signature", tx);

  // Fetch data from the account.
  let account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log('👀 GIF Count', account.totalGifs.toString())

  // call addGif function
  await program.rpc.addGif("https://media.giphy.com/media/qrwthQPPQrtEk/giphy.gif", {
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
    },
  });

  // call vote function
  await program.rpc.vote("https://media.giphy.com/media/qrwthQPPQrtEk/giphy.gif", {
    accounts: {
      baseAccount: baseAccount.publicKey,
    },
  });
  
  account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log('👀 GIF Count', account.totalGifs.toString())
  console.log('👀 GIF Votes', account.gifList.votes)
}

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

runMain();
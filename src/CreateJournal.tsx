import { Transaction } from "@mysten/sui/transactions";
import { Button, Container, TextField } from "@radix-ui/themes";
import { useSignAndExecuteTransaction, useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import { useNetworkVariable } from "./networkConfig";
import ClipLoader from "react-spinners/ClipLoader";
import { useState } from "react";

export function CreateJournal({
  onCreated,
}: {
  onCreated: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const journalPackageId = useNetworkVariable("journalPackageId");
  
  const {
    mutate: signAndExecute,
    isPending,
    isSuccess,
  } = useSignAndExecuteTransaction();

  const handleTransactionSuccess = async ({ digest }: { digest: string }) => {
    const { effects } = await suiClient.waitForTransaction({
      digest: digest,
      options: {
        showEffects: true,
      },
    });

    onCreated(effects?.created?.[0]?.reference?.objectId!);
  };

  function create() {
    if (!currentAccount) return;

    const transaction = new Transaction();

    const [journal] = transaction.moveCall({
      target: `${journalPackageId}::journal::new_journal`,
      arguments: [transaction.pure.string(title)],
    });

    transaction.transferObjects([journal], currentAccount.address);

    signAndExecute(
      {
        transaction,
      },
      {
        onSuccess: handleTransactionSuccess,
      },
    );
  }

  const isDisabled = isSuccess || isPending || !title.trim();
  const buttonLabel = isSuccess || isPending ? <ClipLoader size={20} /> : "Create Journal";

  return (
    <Container>
      <TextField.Root
        placeholder="Enter journal title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        size="3"
        mb="3"
      />
      <Button
        size="3"
        onClick={create}
        disabled={isDisabled}
      >
        {buttonLabel}
      </Button>
    </Container>
  );
}
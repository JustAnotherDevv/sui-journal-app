import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import type { SuiObjectData } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Button, Flex, Heading, Text, TextArea, Box } from "@radix-ui/themes";
import { useNetworkVariable } from "./networkConfig";
import { useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";

function formatTimestamp(timestampMs: string): string {
  const date = new Date(parseInt(timestampMs));
  return date.toLocaleString();
}

function getJournalFields(data: SuiObjectData) {
  if (data.content?.dataType !== "moveObject") {
    return null;
  }

  const fields = data.content.fields as {
    owner: string;
    title: string;
    entries: Array<{ fields: { content: string; create_at_ms: string } }>;
  };

  return {
    title: fields.title,
    owner: fields.owner,
    entries: fields.entries?.map((entry) => entry.fields) || [],
  };
}

export function Journal({ id, onBack }: { id: string; onBack: () => void }) {
  const [newEntryContent, setNewEntryContent] = useState("");
  const [waitingForTxn, setWaitingForTxn] = useState(false);
  
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const journalPackageId = useNetworkVariable("journalPackageId");
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  const { data, isPending, error, refetch } = useSuiClientQuery("getObject", {
    id,
    options: {
      showOwner: true,
      showContent: true,
    },
  });

  const handleAddEntry = () => {
    if (!newEntryContent.trim()) return;

    setWaitingForTxn(true);

    const transaction = new Transaction();

    transaction.moveCall({
      target: `${journalPackageId}::journal::add_entry`,
      arguments: [
        transaction.object(id),
        transaction.pure.string(newEntryContent),
        transaction.object.clock(),
      ],
    });

    signAndExecute(
      {
        transaction,
      },
      {
        onSuccess: (tx) => {
          suiClient.waitForTransaction({ digest: tx.digest }).then(async () => {
            await refetch();
            setNewEntryContent("");
            setWaitingForTxn(false);
          });
        },
        onError: () => {
          setWaitingForTxn(false);
        },
      },
    );
  };

  if (isPending) return <Text>Loading...</Text>;

  if (error) return <Text>Error: {error.message}</Text>;

  if (!data || !data.data) return <Text>Not found</Text>;

  const journalFields = getJournalFields(data.data);
  const ownedByCurrentAccount = journalFields?.owner === currentAccount?.address;

  return (
    <>
      <Flex justify="between" align="center" mb="3">
        <Heading size="3">{journalFields?.title || "Journal"}</Heading>
        <Button variant="soft" onClick={onBack}>
          Back to Journals
        </Button>
      </Flex>

      <Flex direction="column" gap="4" mt="4">
        <Box>
          <Heading size="2" mb="2">
            Past Entries
          </Heading>
          {journalFields?.entries && journalFields.entries.length > 0 ? (
            <Flex direction="column" gap="3">
              {journalFields.entries.map((entry: any, index: number) => (
                <Box
                  key={index}
                  p="3"
                  style={{
                    borderRadius: "var(--radius-2)",
                    background: "var(--gray-a3)",
                  }}
                >
                  <Text size="1" color="gray" mb="1">
                    {formatTimestamp(entry.create_at_ms)}
                  </Text>
                  <Text m="1">{entry.content}</Text>
                </Box>
              ))}
            </Flex>
          ) : (
            <Text color="gray">No entries yet</Text>
          )}
        </Box>

        {ownedByCurrentAccount && (
          <Box>
            <Heading size="2" mb="2">
              Add New Entry
            </Heading>
            <Flex direction="column" gap="2">
              <TextArea
                placeholder="Write your journal entry here..."
                value={newEntryContent}
                onChange={(e) => setNewEntryContent(e.target.value)}
                disabled={waitingForTxn}
                rows={4}
              />
              <Button
                onClick={handleAddEntry}
                disabled={waitingForTxn || !newEntryContent.trim()}
              >
                {waitingForTxn ? <ClipLoader size={20} /> : "Add Entry"}
              </Button>
            </Flex>
          </Box>
        )}
      </Flex>
    </>
  );
}
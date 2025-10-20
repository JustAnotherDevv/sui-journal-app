import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { Box, Card, Flex, Heading, Text } from "@radix-ui/themes";
import { useNetworkVariable } from "./networkConfig";
import ClipLoader from "react-spinners/ClipLoader";

export function JournalList({
  onSelectJournal,
}: {
  onSelectJournal: (id: string) => void;
}) {
  const journalPackageId = useNetworkVariable("journalPackageId");
  const currentAccount = useCurrentAccount();

  const { isPending, error, data } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: currentAccount?.address as string,
      options: {
        showType: true,
        showContent: true,
      },
      filter: {
        StructType: `${journalPackageId}::journal::Journal`,
      },
    },
    {
      enabled: !!currentAccount?.address,
    }
  );

  if (error) {
    return <Text color="red">Error loading journals: {error.message}</Text>;
  }

  if (isPending) {
    return (
      <Flex justify="center" align="center" p="6">
        <ClipLoader size={40} />
      </Flex>
    );
  }

  const journals = data?.data || [];

  return (
    <Box>
      <Heading size="5" mb="4">
        My Journals
      </Heading>

      {journals.length === 0 ? (
        <Card>
          <Text color="gray">
            You don't have any journals yet. Create your first journal to get
            started!
          </Text>
        </Card>
      ) : (
        <Flex direction="column" gap="3">
          {journals.map((journal) => {
            const content = journal.data?.content;
            const fields =
              content?.dataType === "moveObject"
                ? (content.fields as { title: string; owner: string })
                : null;
            const objectId = journal.data?.objectId;
            const title = fields?.title || "Untitled Journal";

            return (
              <Card
                key={objectId}
                style={{ cursor: "pointer" }}
                onClick={() => onSelectJournal(objectId!)}
              >
                <Heading size="3">{title}</Heading>
                <Text size="1" color="gray" mt="1">
                  ID: {objectId}
                </Text>
              </Card>
            );
          })}
        </Flex>
      )}
    </Box>
  );
}
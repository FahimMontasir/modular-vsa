import { Card, useThemeColor } from "heroui-native";
import { Text, View, Pressable } from "react-native";

import { Container } from "@/components/container";
import { SignIn } from "@/components/sign-in";
import { SignUp } from "@/components/sign-up";
import { authClient } from "@/lib/auth-client";

export default function Home() {
  const { data: session } = authClient.useSession();

  const _mutedColor = useThemeColor("muted");
  const _successColor = useThemeColor("success");
  const _dangerColor = useThemeColor("danger");
  const _foregroundColor = useThemeColor("foreground");

  return (
    <Container className="p-6">
      <View className="mb-6 py-4">
        <Text className="mb-2 text-4xl font-bold text-foreground">BETTER T STACK</Text>
      </View>

      {session?.user ? (
        <Card variant="secondary" className="mb-6 p-4">
          <Text className="mb-2 text-base text-foreground">
            Welcome, <Text className="font-medium">{session.user.name}</Text>
          </Text>
          <Text className="mb-4 text-sm text-muted">{session.user.email}</Text>
          <Pressable
            className="bg-danger self-start rounded-lg px-4 py-3 active:opacity-70"
            onPress={() => {
              authClient.signOut();
            }}
          >
            <Text className="font-medium text-foreground">Sign Out</Text>
          </Pressable>
        </Card>
      ) : null}

      {!session?.user && (
        <>
          <SignIn />
          <SignUp />
        </>
      )}
    </Container>
  );
}

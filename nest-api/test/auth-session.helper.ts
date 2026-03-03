import request from "supertest";

type SupertestApp = Parameters<typeof request>[0];
type Agent = ReturnType<typeof request.agent>;

interface SignInResponseBody {
  user: {
    id: string;
  };
  csrfToken: string;
}

export interface AuthenticatedSession {
  agent: Agent;
  userId: string;
  csrfToken: string;
}

export async function createAuthenticatedSession(app: SupertestApp): Promise<AuthenticatedSession> {
  const agent = request.agent(app);
  const signInRes = await agent
    .post("/api/users")
    .send({ email: "e2e-test@test.com", password: "e2e-test-password" })
    .expect(200);

  const body = signInRes.body as SignInResponseBody;
  if (!body.csrfToken) {
    throw new Error("Expected csrfToken in sign-in response");
  }

  agent.set("x-csrf-token", body.csrfToken);

  return {
    agent,
    userId: body.user.id,
    csrfToken: body.csrfToken,
  };
}

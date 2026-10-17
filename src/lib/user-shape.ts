/** Shared user JSON shape (snake_case, mirrors §1c style). */
export interface UserJson {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  plan_type: string;
  created_at: string;
}

export function userToJson(user: {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  planType: string;
  createdAt: Date;
}): UserJson {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    display_name: user.displayName,
    plan_type: user.planType,
    created_at: user.createdAt.toISOString(),
  };
}

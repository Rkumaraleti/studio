// @ts-ignore
import { v4 as uuidv4 } from "uuid";
import { useEffect, useState } from "react";

const ANON_USER_KEY = "anon_user_id";

export function useAnonymousUser() {
  const [anonUserId, setAnonUserId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem(ANON_USER_KEY);
    if (!id) {
      id = uuidv4();
      if (id) localStorage.setItem(ANON_USER_KEY, id);
    }
    if (id) setAnonUserId(id);
  }, []);

  return anonUserId;
} 
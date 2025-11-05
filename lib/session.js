// lib/session.js
import { v4 as uuidv4 } from "uuid";

export function getUserId() {
  let id = localStorage.getItem("anon_user_id");
  if (!id) {
    id = uuidv4();
    localStorage.setItem("anon_user_id", id);
  }
  return id;
}

export function getSessionId() {
  // For simplicity: one per page load
  if (!window._sessionId) {
    window._sessionId = uuidv4();
  }
  return window._sessionId;
}

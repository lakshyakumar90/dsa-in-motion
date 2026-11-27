import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { HomePage } from "@/features/home/HomePage";
import { PlaygroundPage } from "@/features/playground/PlaygroundPage";
import { ProblemPage } from "@/features/problems/ProblemPage";
import { QuestionsPage } from "@/features/questions/QuestionsPage";
import { TopicPage } from "@/features/topics/TopicPage";
import { NotesPage } from "@/features/notes/NotesPage";
import { ThemeProvider } from "@/app/providers/ThemeProvider";

interface RouteState { name: "home" | "questions" | "notes" | "lab" | "topic" | "question" | "not-found"; value?: string }
function getRoute(): RouteState {
  const [path, value] = window.location.hash.slice(1).split("/");
  if (path === "questions") return { name: "questions" };
  if (path === "notes") return { name: "notes" };
  if (path === "lab") return { name: "lab" };
  if (path === "topic" && value !== undefined) return { name: "topic", value };
  if (path === "question" && value) return { name: "question", value };
  if (!path || path === "home" || path === "learn") return { name: "home" };
  return { name: "not-found" };
}

function RoutedContent() {
  const [route, setRoute] = useState(getRoute);
  useEffect(() => { const update = () => { setRoute(getRoute()); window.scrollTo({ top: 0, behavior: "auto" }); }; window.addEventListener("hashchange", update); return () => window.removeEventListener("hashchange", update); }, []);
  let content;
  if (route.name === "home") content = <HomePage />;
  else if (route.name === "questions") content = <QuestionsPage />;
  else if (route.name === "notes") content = <NotesPage />;
  else if (route.name === "lab") content = <PlaygroundPage />;
  else if (route.name === "topic") { const index = Number(route.value); content = Number.isInteger(index) && index >= 0 ? <TopicPage topicIndex={index} /> : <div className="empty-state large">Topic not found.</div>; }
  else if (route.name === "question") content = <ProblemPage key={route.value} problemId={route.value ?? ""} />;
  else content = <div className="empty-state large">Page not found. <a href="#home">Go home.</a></div>;
  return <ThemeProvider><Header /><main className="site-main" id="main">{content}</main><footer className="site-footer"><a href="#home" className="footer-brand">dsa<span>.motion</span></a><p>Visual DSA learning companion — 165 problems, 3 approaches each, tailored DS animations & illustrated notes.</p><div className="footer-links"><a href="#notes">Notes</a><a href="#questions">Practice sheet <span>↗</span></a></div></footer></ThemeProvider>;
}

export default function App() { return <RoutedContent />; }

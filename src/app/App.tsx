import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { HomePage } from "@/components/pages/HomePage";
import { PlaygroundPage } from "@/components/pages/PlaygroundPage";
import { ProblemPage } from "@/components/pages/ProblemPage";
import { QuestionsPage } from "@/components/pages/QuestionsPage";
import { TopicPage } from "@/components/pages/TopicPage";
import { ThemeProvider } from "@/app/providers/ThemeProvider";

interface RouteState { name: "home" | "questions" | "lab" | "topic" | "question" | "not-found"; value?: string }
function getRoute(): RouteState {
  const [path, value] = window.location.hash.slice(1).split("/");
  if (path === "questions") return { name: "questions" };
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
  else if (route.name === "lab") content = <PlaygroundPage />;
  else if (route.name === "topic") { const index = Number(route.value); content = Number.isInteger(index) && index >= 0 ? <TopicPage topicIndex={index} /> : <div className="empty-state large">Topic not found.</div>; }
  else if (route.name === "question") content = <ProblemPage key={route.value} problemId={route.value ?? ""} />;
  else content = <div className="empty-state large">Page not found. <a href="#home">Go home.</a></div>;
  return <ThemeProvider><Header /><main className="site-main" id="main">{content}</main><footer className="site-footer"><a href="#home" className="footer-brand">dsa<span>.motion</span></a><p>An independent learning companion with original explanations, algorithms, and visualizations.</p><a href="#questions">Question sheet <span>↗</span></a></footer></ThemeProvider>;
}

export default function App() { return <RoutedContent />; }

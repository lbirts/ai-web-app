import Sidebar from "./components/Sidebar";

export default function Home() {
  return (
    <main className="flex flex-row  gap-4 bg-white dark:bg-black flex-1">
      <Sidebar />
    </main>
  );
}

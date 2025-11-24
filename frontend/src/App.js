import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SkyCodecPage from "@/pages/SkyCodecPage";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SkyCodecPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
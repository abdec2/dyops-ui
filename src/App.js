import HeaderComponent from "./components/Header";
import Presale from "./components/Presale";
import FooterComponent from './components/Footer';
import { useEffect, useState } from "react";
import { GlobalProvider } from "./context/GlobalContext";

import AlertBox from "./components/AlertBox";

function App() {
  const [error, setError] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    // if (!window.ethereum) {
    //   alert('Please install MetaMask');
    // }

  }, []);
  return (
    <GlobalProvider>

      <div className="container mx-auto px-10 max-w-7xl">
          <Presale setError={setError} setErrMsg={setErrMsg} />
      </div>
      {error && (<AlertBox  msg={errMsg}/>)}
    </GlobalProvider>
  );
}

export default App;

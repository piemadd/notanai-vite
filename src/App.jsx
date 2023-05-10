import { useState, useRef, useEffect, useMemo } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import useWebSocket from "react-use-websocket";

const App = () => {
  const [messages, setMessages] = useState([]);
  const [textBox, setTextBox] = useState("");
  const [cfToken, setCFToken] = useState("");
  const turnstileRef = useRef(null);

  const { sendJsonMessage } = useWebSocket("wss://api.notanai.co", {
    onOpen: () => {
      console.log("opened");
      setMessages([]);
    },
    onMessage: (e) => {
      const messageContent = JSON.parse(e.data);
      console.log("message received:", messageContent);

      setMessages((prev) => [
        ...prev,
        { type: "ai", content: messageContent.data },
      ]);
    },
    shouldReconnect: (closeEvent) => true,
  });

  const handleTurnstile = (token) => {
    console.log("new turnstile token");
    setCFToken(token);
  };

  const handleMessage = (message) => {
    setMessages((prev) => [...prev, { type: "user", content: message }]);
    sendJsonMessage({
      content: message,
      token: cfToken,
    });

    turnstileRef.current?.reset();
    setTextBox("");
  };

  return (
    <>
      <section className='title'>
        <h1>Not an AI</h1>
        <p>
          Built by <a href='https://piemadd.com/'>Piero</a> in Chicago
        </p>
      </section>
      <main>
        {messages.length === 0 && (
          <section className='examples'>
            <p
              onClick={(e) => {
                setTextBox(e.target.innerText.replaceAll('"', ""));
              }}
            >
              "What is today's date?"
            </p>
            <p
              onClick={(e) => {
                setTextBox(e.target.innerText.replaceAll('"', ""));
              }}
            >
              "What is a good movie to watch?"
            </p>
            <p
              onClick={(e) => {
                setTextBox(e.target.innerText.replaceAll('"', ""));
              }}
            >
              "Isn't this a bit dehumanizing?"
            </p>
            <p
              onClick={(e) => {
                setTextBox(e.target.innerText.replaceAll('"', ""));
              }}
            >
              "She Ashland on my Avenue till I Irving Park Road"
            </p>
          </section>
        )}

        <section className='conversation'>
          {messages.map((message, i) => {
            return (
              <p
                key={i}
                className={`message ${message.type === "ai" ? "ai" : "user"}`}
              >
                {message.content}
              </p>
            );
          })}
        </section>
        <section className='input'>
          <textarea
            type='text'
            placeholder='Type here...'
            value={textBox}
            onChange={(e) => {
              setTextBox(e.target.value);
            }}
            onKeyUp={(e) => {
              if (e.key === "Enter") {
                console.log("enter pressed");
                handleMessage(textBox);
              }
            }}
          />
          <button
            onClick={() => {
              console.log("clicked submit");
              handleMessage(textBox);
            }}
          >
            Send
          </button>
        </section>
        <Turnstile
          ref={turnstileRef}
          siteKey='0x4AAAAAAAEjlGNn9HtBGRuM'
          onSuccess={handleTurnstile}
        />
      </main>
      <footer>
        <a href='/privacy.txt'>Privacy Policy</a>
      </footer>
    </>
  );
};

export default App;

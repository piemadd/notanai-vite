import { useState, useRef } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import useWebSocket from "react-use-websocket";

const App = () => {
  const [messages, setMessages] = useState([]);
  const [textBox, setTextBox] = useState("");
  const [cfToken, setCFToken] = useState("");
  const [showPopup, setShowPopup] = useState(true);
  const turnstileRef = useRef(null);

  const { sendJsonMessage } = useWebSocket("wss://api.notanai.co", {
    onOpen: () => {
      console.log("opened");
      setMessages([]);
    },
    onMessage: (e) => {
      const messageContent = JSON.parse(e.data);
      console.log("message received:", messageContent);

      setMessages((prev) => [...prev, { type: "ai", content: messageContent }]);
    },
    shouldReconnect: (closeEvent) => true,
  });

  const handleTurnstile = (token) => {
    console.log("new turnstile token");
    setCFToken(token);
  };

  const handleMessage = (message) => {
    setMessages((prev) => [
      ...prev,
      {
        type: "user",
        content: {
          type: "message",
          data: message,
        },
      },
    ]);
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
        <p>Have a funny interaction? Share it!</p>
      </section>
      {showPopup && (
        <div id='popup'>
          <h2>PLEASE READ!</h2>
          <p>
            Language on this site may not be suitable for those under the age of
            18. If you are under the age of 18, please leave this site.
            Additionally, any interactions on this site are not endorsed by
            Piero Maddaleni.
          </p>
          <p>
            Remember, you are talking to <i>real people</i>. Don't be a dick.
          </p>
          <button onClick={() => setShowPopup(false)}>I am 18, LEMMMEEE INNNNN!</button>
        </div>
      )}

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
            if (message.content?.type === "error") {
              return (
                <p
                  key={i}
                  className={`message error ${
                    message.type === "ai" ? "ai" : "user"
                  }`}
                >
                  {message.content?.data}
                </p>
              );
            } else if (message.content?.type === "message") {
              return (
                <p
                  key={i}
                  className={`message ${message.type === "ai" ? "ai" : "user"}`}
                >
                  {message.content?.data}
                </p>
              );
            } else if (message.content?.type === "attachment") {
              return (
                <img
                  key={i}
                  className={`message ${message.type === "ai" ? "ai" : "user"}`}
                  src={message.content?.data}
                />
              );
            }
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
        <p>
          <a href='/privacy.html'>Privacy Policy</a>
        </p>
        <p>
          Built by <a href='https://piemadd.com/'>Piero</a> in Chicago
        </p>
        <p>Not an AI v1.1.4</p>
      </footer>
    </>
  );
};

export default App;

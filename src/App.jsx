import { useState, useRef, useMemo, useEffect } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import useWebSocket from "react-use-websocket";
import ReactMarkdown from "react-markdown";
import { socket } from "./socket";

const App = () => {
  const [messages, setMessages] = useState([]);
  const [currentConvo, setCurrentConvo] = useState(null);
  const [initialConvo, setInitialConvo] = useState(null);
  const [textBox, setTextBox] = useState("");
  const [cfToken, setCFToken] = useState("");
  const [error, setError] = useState(null);
  const [showPopup, setShowPopup] = useState(true);
  const turnstileRef = useRef(null);

  const prevConversationsInit = Object.keys(localStorage).filter((key) => {
    const content = localStorage.getItem(key);
    if (!content) {
      localStorage.removeItem(key);
      return false;
    }

    const parsedContent = JSON.parse(content);
    if (parsedContent.messages.length === 0 && key !== initialConvo) {
      localStorage.removeItem(key);
      return false;
    }

    return key.includes("conversation-");
  });

  const [prevConversations, setPrevConversations] = useState(
    prevConversationsInit
  );

  const handleExampleClick = (e) => {
    setTextBox(e.target.innerText.replaceAll('"', ""));
  };

  useEffect(() => {
    // on connect
    const onConnect = () => {
      console.log("opened");
      console.log("Clearing messages after socket open");
      setMessages([]);
    };

    // on yeet
    const onDisconnect = () => {
      console.log("RIP :c");
    };

    // on message
    const onMessage = (e) => {
      const messageContent = JSON.parse(e);
      console.log("message received:", messageContent);

      if (
        messageContent.type === "message" ||
        messageContent.type === "error" ||
        messageContent.type === "attachment"
      ) {
        //adding message to state and saving to local storage
        gtag("event", "server_message");

        console.log(messages);

        const prev = [...messages];
        console.log("Saving messages after new ai message");

        console.log(currentConvo);

        localStorage.setItem(
          currentConvo,
          JSON.stringify({
            messages: [...prev, { type: "ai", content: messageContent }],
            time: Date.now(),
          })
        );

        console.log("Setting messages after new ai message");
        setMessages([...prev, { type: "ai", content: messageContent }]);
      } else if (messageContent.type === "uuid") {
        console.log("new uuid");
        //saving the state of this conversation to local storage for later use

        if (currentConvo !== null) {
          console.log(
            "current conversation is not null, telling server to fuck off"
          );
          socket.emit(
            "message",
            JSON.stringify({
              type: "uuid",
              data: currentConvo.split("-")[1],
            })
          );
        } else {
          console.log(`new uuid conversation-${messageContent.data}`);

          setPrevConversations((prev) => [
            ...prev,
            `conversation-${messageContent.data}`,
          ]);

          console.log(
            "Setting current convo to that contained in:",
            messageContent
          );

          setCurrentConvo(`conversation-${messageContent.data}`);
          setInitialConvo(`conversation-${messageContent.data}`);
          console.log("Saving messages after new error");
          localStorage.setItem(
            `conversation-${messageContent.data}`,
            JSON.stringify({
              messages: messages.filter(
                (message) => message.content?.type !== "error"
              ),
              time: Date.now(),
            })
          );
        }
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("message", onMessage);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("message", onMessage);
    };
  }, [currentConvo, messages]);

  const handleTurnstile = (token) => {
    console.log("new turnstile token");
    setCFToken(token);
  };

  const handleMessage = (message) => {
    if (message === "") {
      return;
    }

    console.log("Setting messages after message handle");
    setMessages((prev) => {
      console.log("Saving messages after message handle");
      localStorage.setItem(
        currentConvo,
        JSON.stringify({
          messages: [
            ...prev,
            {
              type: "user",
              content: {
                type: "message",
                data: message,
              },
            },
          ].filter((message) => message.content?.type !== "error"),
          time: Date.now(),
        })
      );
      return [
        ...prev,
        {
          type: "user",
          content: {
            type: "message",
            data: message,
          },
        },
      ];
    });

    socket.emit(
      "message",
      JSON.stringify({
        content: message,
        token: cfToken,
      })
    );

    gtag("event", "client_message");

    turnstileRef.current?.reset();
    setCFToken("");
    setTextBox("");
  };

  const lastExample = useMemo(() => {
    const examples = [
      `"She Ashland on my Avenue till I Irving Park Road"`,
      `"Why did my wife leave me?"`,
      `"What is the meaning of life?"`,
      `"What is a fortnite?"`,
      `"Thoughts on EMD?"`,
    ];

    return examples[Math.floor(Math.random() * examples.length)];
  }, []);

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
            18. If you are under the age of 18, strongly consider leaving.
            Additionally, any interactions on this site are not endorsed by the
            creators of this site.
          </p>
          <p>
            Remember, you are talking to <i>real people</i>, who happen to
            mostly be zoomers. Don't be a dick, or they'll happily be dicks
            back.
          </p>
          <button onClick={() => setShowPopup(false)}>
            I am 18, LEMMMEEE INNNNN!
          </button>
          <br />
          <p>
            <a href='/privacy.html'>Privacy Policy</a>
          </p>
          <p>Not an AI v2.0.2</p>
        </div>
      )}

      <main>
        {messages.length === 0 && (
          <section className='examples'>
            <p onClick={handleExampleClick}>"What is today's date?"</p>
            <p onClick={handleExampleClick}>"What is a good movie to watch?"</p>
            <p onClick={handleExampleClick}>"Isn't this a bit dehumanizing?"</p>
            <p onClick={handleExampleClick}>{lastExample}</p>
          </section>
        )}

        <section className='convoSelector'>
          <select
            onChange={(e) => {
              const newConvoID = e.target.selectedOptions[0].value;

              console.log("Setting current convo from list");
              console.log(newConvoID);

              setCurrentConvo(newConvoID);
              console.log("fetching previous messages");

              if (localStorage.getItem(newConvoID)) {
                console.log("previous messages found!");
                console.log(JSON.parse(localStorage.getItem(newConvoID)));
                const prevMessages = JSON.parse(
                  localStorage.getItem(newConvoID)
                ).messages;
                console.log(prevMessages);
                setMessages(prevMessages);

                socket.emit(
                  "message",
                  JSON.stringify({
                    type: "uuid",
                    data: newConvoID.split("-")[1],
                  })
                );

                //removing initial convo from list of previous convos
                setPrevConversations((prev) => {
                  return prev.filter((convo) => convo !== initialConvo);
                });
              }
            }}
          >
            {prevConversations.map((convoID) => {
              let convo = localStorage.getItem(convoID);

              if (convoID === initialConvo) {
                console.log("Adding initial convo to local storage");
                localStorage.setItem(
                  convoID,
                  JSON.stringify({
                    messages: messages.filter(
                      (message) => message.content?.type !== "error"
                    ),
                    time: Date.now(),
                  })
                );
                convo = localStorage.getItem(convoID);
              }

              if (!convo) {
                console.log(convoID, initialConvo);
                console.log("error fetching convo, not adding to list");
                return null;
              }

              const title = `${convoID.split("-")[2]} - ${new Date(
                JSON.parse(convo).time
              ).toLocaleString([], {
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}`;
              if (convoID === currentConvo) {
                return (
                  <option value={convoID} selected>
                    {title}
                  </option>
                );
              } else return <option value={convoID}>{title}</option>;
            })}
          </select>
          <button
            onClick={() => {
              localStorage.removeItem(currentConvo);
              setPrevConversations((prev) => {
                return prev.filter((convo) => convo !== currentConvo);
              });
              console.log("Deleting current convo");
              setCurrentConvo(initialConvo);

              console.log("Clearing messages after thread delete");
              setMessages([]);
              window.location.reload();

              socket.emit(
                "message",
                JSON.stringify({
                  type: "message",
                  data: "Thread Deleted on Client Side, riperonis",
                })
              );
            }}
          >
            Delete
          </button>
        </section>
        <section className='conversation'>
          {messages.map((message, i) => {
            if (message.content?.type === "error") {
              console.log("new error: ", message.content?.data);
              return (
                <ReactMarkdown
                  key={i}
                  className={`message error ${
                    message.type === "ai" ? "ai" : "user"
                  }`}
                >
                  {message.content?.data}
                </ReactMarkdown>
              );
            } else if (message.content?.type === "message") {
              return (
                <ReactMarkdown
                  key={i}
                  className={`message ${message.type === "ai" ? "ai" : "user"}`}
                >
                  {message.content?.data}
                </ReactMarkdown>
              );
            } else if (message.content?.type === "attachment") {
              const attachmentEnding = message.content?.data
                .split("?")[0]
                .split(".")
                .pop();
              console.log("attachment ending", attachmentEnding);

              if (["png", "jpg", "jpeg", "gif"].includes(attachmentEnding)) {
                return (
                  <img
                    key={i}
                    className={`message ${
                      message.type === "ai" ? "ai" : "user"
                    }`}
                    src={message.content?.data}
                  />
                );
              } else if (
                ["mp4", "webm", "mov"].includes(
                  message.content?.data.split(".").pop()
                )
              ) {
                return (
                  <video
                    key={i}
                    className={`message ${
                      message.type === "ai" ? "ai" : "user"
                    }`}
                    src={message.content?.data}
                    controls
                  />
                );
              } else {
                return (
                  <a
                    key={i}
                    className={`message ${
                      message.type === "ai" ? "ai" : "user"
                    }`}
                    href={message.content?.data}
                  >
                    {message.content?.data}
                  </a>
                );
              }
            } else if (message.content?.type === "image") {
              return (
                <img
                  key={i}
                  className={`message ${message.type === "ai" ? "ai" : "user"}`}
                  src={message.content?.data}
                />
              );
            } else if (message.content?.type === "video") {
              return (
                <video
                  key={i}
                  className={`message ${message.type === "ai" ? "ai" : "user"}`}
                  src={message.content?.data}
                  controls
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
            {...(textBox.length === 0 && { disabled: true })}
            {...(cfToken.length === 0 && { disabled: true })}
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
        <p>Not an AI v2.0.2</p>
      </footer>
    </>
  );
};

export default App;

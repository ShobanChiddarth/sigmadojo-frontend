import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import "./App.css";

const API_URL = window.__ENV__.VITE_BACKEND_URL;

const defaultRule = `title: Test Rule
id: uuid
description: Generic test rule

logsource:
    product: test

detection:
    selection:
        EventID: 4688
    condition: selection

level: low
`;

function App() {
  const [challenges, setChallenges] = useState([]);
  const [datasets, setDatasets] = useState([]);

  const [selectedItem, setSelectedItem] = useState("playground");
  const [selectedDataset, setSelectedDataset] = useState("");
  const [selectedTarget, setSelectedTarget] = useState("splunk_spl");

  const [rule, setRule] = useState(defaultRule);

  const [popup, setPopup] = useState(null);

  const selectedChallenge =
    challenges.find(
      (challenge) => challenge.id === Number(selectedItem)
    );


  useEffect(() => {
        async function initialize() {
            const challengeResponse = await fetch(
                `${API_URL}/challenges`
            );

            const challengeData = await challengeResponse.json();
            setChallenges(challengeData);

            const datasetResponse = await fetch(
                `${API_URL}/log-datasets`
            );

            const datasetData = await datasetResponse.json();

            etDatasets(datasetData);

            if (datasetData.length > 0) {
                setSelectedDataset(datasetData[0]);
            }
        }
        initialize();
    }, []);

  function encodeRule() {
    return btoa(rule);
  }

  async function validateRule() {
    try {
      const response = await fetch(
        `${API_URL}/validate-rule`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            rule: encodeRule()
          })
        }
      );

      const data = await response.json();

      if (data.valid) {
        setPopup({
          type: "validation",
          valid: true,
          message: "Rule is valid"
        });
      }

      else {
        setPopup({
          type: "validation",
          valid: false,
          message: data.error
        });
      }

    }

    catch (err) {
      setPopup({
        type: "validation",
        valid: false,
        message: err.message
      });
    }
  }

  async function validateSigmaRule() {
    try {
      const response = await fetch(
        `${API_URL}/validate-sigma-rule`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            rule: encodeRule()
          })
        }
      );

      const data = await response.json();

      if (data.valid) {
        setPopup({
          type: "validation",
          valid: true,
          message: "Rule is valid"
        });
      }

      else {
        setPopup({
          type: "validation",
          valid: false,
          message: data.error
        });
      }
    }

    catch(err) {
      setPopup({
        type: "validation",
        valid:false,
        message:err.message
      });
    }
  }

  async function runRule() {
    try {
      const response = await fetch(
        `${API_URL}/run-rule`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            rule: encodeRule(),
            dataset: selectedDataset
          })
        }
      );

      const data = await response.json();

      setPopup({
        type: "results",
        count: data.count,
        result: data.result
      });
    }

    catch(err) {
      setPopup({
        type: "validation",
        valid:false,
        message: err.message
      });

    }
  }

  async function convertRule() {
    try {
      const response = await fetch(
        `${API_URL}/transpile-rule`,
        {
          method:"POST",
          headers:{
            "Content-Type":"application/json"
          },
          body:JSON.stringify({
            rule:encodeRule(),
            target:selectedTarget
          })
        }
      );
      const data = await response.json();
      setPopup({
        type:"conversion",
        queries:data.queries,
        error:data.error
      });

    }

    catch(err){
      setPopup({
        type:"validation",
        valid:false,
        message:err.message
      });
    }
  }

    async function runChallenge() {

    try {
      const response = await fetch(
        `${API_URL}/challenges/${selectedChallenge.id}`,
        {
          method:"POST",
          headers:{
            "Content-Type":"application/json"
          },
          body:JSON.stringify({
            rule:encodeRule()
          })
        }
      );
      const data = await response.json();
      setPopup({
        type:"challenge",
        ...data
      });
    }

    catch(err){
      setPopup({
        type:"validation",
        valid:false,
        message:err.message
      });
    }
  }

  async function viewAnswer(){

    const response = await fetch(
      `${API_URL}/challenges/${selectedChallenge.id}`
    );

    const data = await response.json();

    setPopup({
      type:"answer",
      rule:atob(data.correct_answer)
    });
  }

  function renderTable(results){

    if (!results || results.length === 0)
      return <p>No results</p>;

    const keys = Object.keys(results[0]);

    return (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              {
                keys.map(
                  key =>
                    <th key={key}>
                      {key}
                    </th>
                )
              }
            </tr>
          </thead>
          <tbody>
          {
            results.map(
              (event,index)=>(
                <tr key={index}>
                {
                  keys.map(
                    key => (
                      <td key={key}>
                        {
                          typeof event[key] === "object"
                          ?
                          JSON.stringify(event[key])
                          :
                          String(event[key])
                        }
                      </td>
                    )
                  )
                }
                </tr>
              )
            )
          }
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <>
    <header className="header">
      <h1>SigmaDojo - Sigma Rule Builder & Live Validation Engine</h1>
    </header>

  <div className="app">
    <div className="left-panel">
      <div className="sidebar">
        <div
          className={ selectedItem === "playground" ? "challenge active" : "challenge" }
          onClick={()=>{
            setSelectedItem("playground");
          }}
        >
          Playground
        </div>
        {
          challenges.map(
            challenge => (
              <div
                key={challenge.id}
                className={ Number(selectedItem) === challenge.id ? "challenge active" : "challenge" }
                onClick={()=>{
                  setSelectedItem(challenge.id);
                }}
              >
                {challenge.id}
              </div>
            )
          )
        }

        <div
          className={ selectedItem === "transpile" ? "challenge active" : "challenge" }
          onClick={()=>{
            setSelectedItem("transpile");
          }}
        >
          Rule Transpiler
        </div>
      </div>

      <div className="description">
        { selectedItem === "playground" ?
            <>
                <h1>
                Playground
                </h1>
                <p>
                Test custom sigma rules against the log datasets.
                </p>
          </>
          : selectedItem === "transpile" ?
            <>
                <h1>
                Transpile given sigma rule to Splunk SPL or Sentinel KQL
                </h1>
                <p>
                Convert Sigma rules into target SIEM query languages.
                </p>
            </>
          : selectedChallenge &&
            <>
                <h1>
                {selectedChallenge.title}
                </h1>
                <p className="question">
                {selectedChallenge.question}
                </p>
            </>
        }
      </div>

    </div>

    <div className="workspace">
      <div className="editor-toolbar">
      { selectedItem === "playground" ?
        <select
          value={selectedDataset}
          onChange={ e=>setSelectedDataset(e.target.value) }
        >
          { datasets.map( dataset=>
              <option key={dataset} value={dataset}>
                {dataset}
              </option>
            )
          }
        </select>

      : selectedItem === "transpile" ?
        <select value={selectedTarget} onChange={ e=>setSelectedTarget(e.target.value) } >
            <option value="splunk_spl">
                splunk_spl
            </option>
            <option value="sentinel_kql">
                sentinel_kql
            </option>
        </select>
      :
        <button onClick={viewAnswer}> View Correct Answer </button>
      }
      </div>

      <Editor
        height="70vh"
        language="yaml"
        theme="vs-dark"
        value={rule}
        onChange={
          value=>setRule(value || "")
        }
      />

      <div className="buttons">
        <button onClick={ selectedItem === "transpile" ? validateSigmaRule : validateRule }>Validate Rule </button>
        { selectedItem === "playground" ?
          <button onClick={runRule}> Run Rule </button>
          : selectedItem === "transpile" ?
          <button onClick={convertRule}> Convert Rule </button>
          :
          <button onClick={runChallenge}> Run Challenge</button>
        }
      </div>
    </div>

    {
      popup &&
      <div className="modal-overlay">
        <div className="modal">
          <button className="close" onClick={()=>setPopup(null)}> X </button>
          { popup.type === "validation" &&
            <div>
                <h2> { popup.valid ? "Valid Rule" : "Invalid Rule" } </h2>
                <p> { popup.message } </p>
            </div>
          }

          { popup.type === "answer" &&
            <Editor
              height="70vh"
              language="yaml"
              theme="vs-dark"
              value={popup.rule}
              options={{
                readOnly:true
              }}
            />
          }

          { popup.type === "conversion" &&
            <>
              <h2>
                Converted Query
              </h2>
              { popup.error !== "nil" ?
                <p>
                  {popup.error}
                </p>
                :
                popup.queries.map(
                  (query,index)=>
                  <pre key={index}>
                    {query}
                  </pre>
                )
              }
            </>
          }

          { popup.type === "results" &&
            <>
              <h2>
                Matches: {popup.count}
              </h2>
              {renderTable(popup.result)}
            </>
          }

          { popup.type === "challenge" &&
            <>
              <h2> Score: {popup.score} </h2>

              <div className="stats">
                <p> True Positives: {popup.true_positive} </p>
                <p> False Positives: {popup.false_positive} </p>
                <p> False Negatives: {popup.false_negative} </p>
                <p> Total Events: {popup.total} </p>
              </div>

              <div className="result-section">
                <h2>Current Output</h2>
                {renderTable(popup.current_result)}
              </div>

              <div className="result-section">
                <h2>Correct Output</h2>
                {renderTable(popup.correct_result)}
              </div>
            </>
          }

        </div>

      </div>
    }

  </div>
  </>
);
}

export default App;

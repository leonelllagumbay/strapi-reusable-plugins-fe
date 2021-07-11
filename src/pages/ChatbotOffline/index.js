import React, { useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import { stemmer } from '../../utils/Stemmer/stemmer';


const ChatbotOffline = () => {
  const [answer, setAnswer] = useState('');
  const [model, setModel] = useState({});
  const [words, setWords] = useState([]);
  const [classes, setClasses] = useState([]);
  const [intentsData, setIntentsData] = useState([]);
  const [conversations, setConversations] = useState([]);

  const sendHandler = () => {
    // Transform question to input
    const xs = transformQuestionToTensor(answer);


    // Make prediction
    const prediction = model.predict(tf.tensor2d(xs, [1, xs.length]));
    const result = prediction.dataSync();

    // Find the question class
    const maxValue = Math.max(...result);
    const maxValueIndex = result.indexOf(maxValue);


    const predictedClass = classes[maxValueIndex];

    // Get responses
    let response = '';
    for (const intent of intentsData) {
      if (intent.tag === predictedClass) {
        // Loop on responses
        // Make a random choice of response
        const responseLen = intent.responses.length;
        response = intent.responses[Math.floor(Math.random() * Math.floor(responseLen))];
      }
    }

    setConversations([...conversations, {
      question: answer,
      answer: response
    }]);

    setAnswer('');
  }

  const wordTokenize = (pattern) => {
    return pattern.split(' ');
  }

  const transformQuestionToTensor = (question) => {
    // list of tokenized words for the pattern
    let patternWords = wordTokenize(question);
    // initialize our bag of words
    const bag = [];

    patternWords = patternWords.map(pWord => {
      // Remove non alpha numeric characters
      pWord = pWord.replace(/[\W+]+/g, '');
      // To lower case
      pWord = pWord.toLowerCase();
      return stemmer(pWord);
    });

    for (const w of words) {
      const wInPatternWords = patternWords.some(pW => {
        return pW === w;
      });
      if (wInPatternWords) {
        bag.push(1);
      } else {
        bag.push(0);
      }
    }

    return bag;
  }

  const getModel = async () => {
    const model = await tf.loadLayersModel('http://localhost:1337/model/model.json');
    setModel(model);
  }

  useEffect(() => {
    console.log('gettng models and questions');
    const requestOptions = {
      method: 'GET',
      redirect: 'follow'
    };

    fetch("http://localhost:1337/chatbot-model", requestOptions)
      .then(response => response.json())
      .then(result => {
        setWords(result.Words);
        setClasses(result.Classes);
        setIntentsData(result.IntentsData);
      })
      .catch(error => console.log('error', error));

    getModel();

  }, []);

  return (
    <>
      <div>Question List
        {conversations.map(conv => (
        <React.Fragment key={`${conv.question}${conv.answer}`}>
          <p><em>{conv.question}</em></p>
          <p>{conv.answer}</p>
        </React.Fragment>
      ))}
      </div>
      <div style={{ margin: '30px' }}>
        Try a question
        <input type="text" onChange={(ev) => setAnswer(ev.target.value)} value={answer} />
        <button type="button" onClick={sendHandler}>Send</button>
      </div>
    </>
  )
}

export default ChatbotOffline;

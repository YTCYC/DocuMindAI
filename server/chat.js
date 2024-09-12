import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"; // splits files
import { OpenAIEmbeddings } from "langchain/embeddings/openai"; // convert text info into vector info
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RetrievalQAChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { PromptTemplate } from "langchain/prompts";

import { PDFLoader } from "langchain/document_loaders/fs/pdf";

const pdfCache = {}; // key: file path, value: processed data

// NOTE: change this default filePath to any of your default file name
const chat = async (
  filePath = "./uploads/Control Risk for Potential Misuse of Artificial Intelligence in Science.pdf",
  query
) => {
  // query is inputed by user
  // async pairs with await
  // chat is the variable that stores the func
  // async is a keyword, signifies that within this func we will need to use await
  let data, splitDocs;
  if (!!pdfCache[filePath]) {
    splitDocs = pdfCache[filePath];
    console.log('Using cached data');
  } else {
    // step 1:
    const loader = new PDFLoader(filePath);

    data = await loader.load(); // returns a Promise, it waits till it got resolved

    // step 2:
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 0,
    });

    splitDocs = await textSplitter.splitDocuments(data);

    // cache the processed data
    pdfCache[filePath] = splitDocs;
    console.log('Caching new data');
  }
  // console.log('splitDocs:', splitDocs);

  // step 3

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.REACT_APP_OPENAI_API_KEY,
  });

  const vectorStore = await MemoryVectorStore.fromDocuments(
    splitDocs,
    embeddings
  );

  // step 4: retrieval

  // const relevantDocs = await vectorStore.similaritySearch(
  // "What is task decomposition?"
  // );

  // step 5: qa w/ customzied prompt
  // we don't need to run step 1 to 3 each time,
  // this code can be optimized
  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    openAIApiKey: process.env.REACT_APP_OPENAI_API_KEY,
  });

  const template = `Use the following pieces of context to answer the question at the end.
If you don't know the answer, just say that you don't know, don't try to make up an answer.
Use three sentences maximum and keep the answer as concise as possible.

{context}
Question: {question}
Helpful Answer:`;

  const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever(), {
    prompt: PromptTemplate.fromTemplate(template),
    // returnSourceDocuments: true,
  });

  const response = await chain.call({
    query,
  });
  // query is question inputed by user

  return response;
};

export default chat;

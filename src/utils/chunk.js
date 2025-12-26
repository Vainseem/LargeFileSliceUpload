import SparkMD5 from 'spark-md5';
export const chunkFile = (file, chunkSize) => {
  const chunkList = [];
  for (let i = 0; i < file.size; i += chunkSize) {
    const index = i / chunkSize;
    chunkList.push({
      name: file.name + '-' + index,
      index: index,
      start: i,
      end: Math.min(i + chunkSize, file.size),
      chunk: file.slice(i, Math.min(i + chunkSize, file.size)),
      hash: ''
    });
  }
  return chunkList;
}

export const calcChunkHash = (chunk) => {
  return new Promise((resolve, reject) => {
    const spark = new SparkMD5.ArrayBuffer();
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      spark.append(e.target.result);
      resolve(spark.end());
    }
    fileReader.readAsArrayBuffer(chunk.chunk);
  })
}

export const hashChunk = async (chunkList) => {
  await Promise.all(chunkList.map(async (chunk) => {
    const hash = await calcChunkHash(chunk);
    chunk.hash = hash;
  }))
  return chunkList;
}
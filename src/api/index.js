import axios from 'axios';
const request = axios.create({
  baseURL: 'http://localhost:4000',
  timeout: 300000, // 大文件上传需要更长的超时时间（5分钟）
})

export const uploadFile = (formData) => {
  return request({
    url: '/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const testFile = (formData) => {
  return request({
    url: '/test',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
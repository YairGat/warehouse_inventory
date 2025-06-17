import React from 'react';
import axios from 'axios';

export interface FileWithId extends File {
    name: string;
    size: number;
}

export interface fileFeatures{
    feature_name: string;
    feature_data: JSON;
}

export async function fetchFeature(feature_name: string): Promise<number> {
    const response = await fetch(`http://192.168.79.1:8080/get_id/`);
    const data = await response.json();
    return data;
}



export async function uploadsFilesToBack(file: FileWithId): Promise<number> {

    const formData = new FormData()
        formData.append('file', file);

    try {
      console.log(formData.getAll)
      const response = await axios.post(`http://192.168.79.1:8080/extract-metadata/`, formData, { headers: { "Content-Type": "multipart/form-data" } })
      
      const data = await response.data();
      return data;

    } catch (error: unknown) {
    //   console.error(error);
      return 0;
    }
  }
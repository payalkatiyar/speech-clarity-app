import axios from 'axios';
import { supabase } from './supabase';

const API_URL = 'http://localhost:8000'; // Make sure the FastAPI is running on 8000

export const predictClarity = async (audioBlob) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.wav');

  try {
    const response = await axios.post(`${API_URL}/predict`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error predicting clarity:', error);
    throw error;
  }
};

export const saveRecord = async (userId, clarityScore, audioUrl) => {
  const { data, error } = await supabase
    .from('speech_records')
    .insert([
      {
        user_id: userId,
        clarity_score: clarityScore,
        audio_url: audioUrl,
      },
    ])
    .select();

  if (error) {
    console.error('Error saving record:', error);
    throw error;
  }
  return data;
};

export const uploadAudio = async (userId, audioBlob, sessionIndex) => {
  const fileName = `${userId}/audio${String(sessionIndex).padStart(2, '0')}.wav`; // sequential per user in folder

  const { data, error } = await supabase.storage
    .from('audio')
    .upload(fileName, audioBlob, {
      contentType: 'audio/wav',
      upsert: true,
    });

  if (error) {
    console.error('Error uploading audio:', error);
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from('audio')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
};

export const deleteRecord = async (recordId, audioUrl) => {
  try {
    console.log('Attempting to delete record from DB:', recordId);
    const { data: removedRows, error: dbError } = await supabase
      .from('speech_records')
      .delete()
      .eq('id', recordId)
      .select();

    if (dbError) throw dbError;
    console.log('Record deleted successfully from DB:', removedRows);

    if (audioUrl) {
      const urlParts = audioUrl.split('/');
      // Extract userId/audioXX.wav (last two parts of the URL)
      const fileName = urlParts.slice(-2).join('/');

      const { error: storageError } = await supabase.storage
        .from('audio')
        .remove([fileName]);

      if (storageError) {
        console.error('CRITICAL: Could not delete audio file from storage:', storageError);
      } else {
        console.log('Audio file matching', fileName, 'deleted from storage bucket.');
      }
    }
    return true;
  } catch (error) {
    console.error('Error deleting record:', error);
    throw error;
  }
};

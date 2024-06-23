import os
import json
import requests
import time
from dotenv import load_dotenv
from collections import defaultdict
import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi
import re

# Hume AI API
load_dotenv()
API_KEY = os.getenv('HUME_API_KEY')
BASE_URL = 'https://api.hume.ai/v0'
BATCH_JOBS_URL = f'{BASE_URL}/batch/jobs'

def download_youtube_video(video_url, output_dir):
    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'outtmpl': os.path.join(output_dir, '%(title)s.%(ext)s'),
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(video_url, download=True)
        video_path = ydl.prepare_filename(info)
    return video_path

def extract_audio(video_path, output_dir):
    audio_path = os.path.join(output_dir, os.path.splitext(os.path.basename(video_path))[0] + '.wav')
    os.system(f'ffmpeg -i "{video_path}" -vn -acodec pcm_s16le -ar 44100 -ac 2 "{audio_path}"')
    return audio_path

def get_youtube_transcript(video_url, output_dir):
    video_id = re.findall(r'(?:v=|\/)([0-9A-Za-z_-]{11}).*', video_url)[0]
    transcript = YouTubeTranscriptApi.get_transcript(video_id)
    transcript_path = os.path.join(output_dir, 'transcript.txt')
    with open(transcript_path, 'w', encoding='utf-8') as f:
        for entry in transcript:
            f.write(f"{entry['text']}\n")
    return transcript_path

def start_hume_job(file_path, model_type):
    with open(file_path, 'rb') as file:
        files = {'file': file}
        if model_type == 'prosody':
            data = {
                'json': json.dumps({
                    'models': {
                        model_type: {
                            'granularity': 'utterance',
                            'identify_speakers': True
                        }
                    }
                })
            }
        elif model_type == 'language':
            data = {
                'json': json.dumps({
                    'models': {
                        model_type: {
                            'granularity': 'utterance'
                        }
                    }
                })
            }
        else:
            data = {
                'json': json.dumps({
                    'models': {
                        model_type: {}
                    }
                })
            }
        headers = {'X-Hume-Api-Key': API_KEY}
        response = requests.post(BATCH_JOBS_URL, files=files, data=data, headers=headers)
    
    if response.status_code == 200:
        return response.json()['job_id']
    else:
        raise Exception(f"Failed to start job: {response.text}")

def get_job_status(job_id):
    headers = {'X-Hume-Api-Key': API_KEY}
    response = requests.get(f'{BATCH_JOBS_URL}/{job_id}', headers=headers)
    return response.json()['state']['status']

def get_job_predictions(job_id):
    headers = {'X-Hume-Api-Key': API_KEY}
    response = requests.get(f'{BATCH_JOBS_URL}/{job_id}/predictions', headers=headers)
    return response.json()

def analyze_modality(file_path, model_type):
    job_id = start_hume_job(file_path, model_type)
    print(f"Started {model_type} analysis job with ID: {job_id}")
    
    while True:
        status = get_job_status(job_id)
        print(f"{model_type.capitalize()} analysis job status: {status}")
        if status == 'COMPLETED':
            break
        time.sleep(5)
    
    predictions = get_job_predictions(job_id)
    return predictions

def write_json_to_file(data, output_path):
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

def get_top_3_emotions(emotions):
    sorted_emotions = sorted(emotions, key=lambda x: x['score'], reverse=True)
    return sorted_emotions[:3]

def synchronize_data(audio_predictions, text_predictions, video_predictions):
    synchronized_data = []
    
    text_chunks = text_predictions[0]['results']['predictions'][0]['models']['language']['grouped_predictions'][0]['predictions']
    audio_chunks = audio_predictions[0]['results']['predictions'][0]['models']['prosody']['grouped_predictions']
    video_frames = video_predictions[0]['results']['predictions'][0]['models']['face']['grouped_predictions'][0]['predictions']
    
    for audio_chunk_group in audio_chunks:
        speaker_id = audio_chunk_group['id']
        for i, audio_chunk in enumerate(audio_chunk_group['predictions']):
            chunk_data = {
                'speaker_id': speaker_id,
                'hume_transcribed_text': audio_chunk['text'],
                # 'youtube_transcript_text': text_chunks[i]['text'],
                'begin': audio_chunk['time']['begin'],
                'end': audio_chunk['time']['end'],
                'audio_emotions': get_top_3_emotions(audio_chunk['emotions']),
                'text_emotions': get_top_3_emotions(text_chunks[i]['emotions']) if i in range(len(text_chunks)) else '',
                'video_emotions': []
            }
            
            # Find all video frames within the chunk's time range
            for frame in video_frames:
                if chunk_data['begin'] <= frame['time'] < chunk_data['end']:
                    chunk_data['video_emotions'].append({
                        'time': frame['time'],
                        'emotions': get_top_3_emotions(frame['emotions'])
                    })
            
            synchronized_data.append(chunk_data)
    
    # Sort the synchronized data by time
    synchronized_data.sort(key=lambda x: x['begin'])
    
    return synchronized_data

def write_synchronized_data_to_file(synchronized_data, output_path):
    with open(output_path, 'w', encoding='utf-8') as f:
        for chunk in synchronized_data:
            f.write(f"Speaker ID: {chunk['speaker_id']}\n")
            f.write(f"Hume Transcribed Text: {chunk['hume_transcribed_text']}\n")
            # f.write(f"Youtube Transcribed Text (what we use for the text emotions): {chunk['youtube_transcript_text']}\n")
            f.write(f"Time: {chunk['begin']:.2f}s - {chunk['end']:.2f}s\n\n")
            
            f.write("Text Top 3 Emotions:\n")
            if chunk['text_emotions']:
                for emotion in chunk['text_emotions']:
                    f.write(f"  - {emotion['name']}: {emotion['score']:.4f}\n")
            else:
                f.write("  No text emotions data available\n")
            f.write("\n")
            
            f.write("Audio Top 3 Emotions:\n")
            if chunk['audio_emotions']:
                for emotion in chunk['audio_emotions']:
                    f.write(f"  - {emotion['name']}: {emotion['score']:.4f}\n")
            else:
                f.write("  No audio emotions data available\n")
            f.write("\n")
            
            f.write("Video Emotions:\n")
            if chunk['video_emotions']:
                for frame in chunk['video_emotions']:
                    f.write(f"  Frame at {frame['time']:.2f}s:\n")
                    for emotion in frame['emotions']:
                        f.write(f"    - {emotion['name']}: {emotion['score']:.4f}\n")
            else:
                f.write("  No video emotions data available\n")
            f.write("\n" + "-"*50 + "\n\n")

def main():
    # Get YouTube video URL from user
    video_url = input("Enter the YouTube video URL: ")
    
    # Create output directory
    output_dir = 'youtube_analysis'
    os.makedirs(output_dir, exist_ok=True)
    
    # Download video and extract audio
    print("Downloading video...")
    video_path = download_youtube_video(video_url, output_dir)
    print("Extracting audio...")
    audio_path = extract_audio(video_path, output_dir)
    print("Getting transcript...")
    transcript_path = get_youtube_transcript(video_url, output_dir)

    # Analyze each modality and dump API responses
    print("Analyzing audio...")
    audio_predictions = analyze_modality(audio_path, 'prosody')
    write_json_to_file(audio_predictions, os.path.join(output_dir, "audio_predictions.json"))
    
    print("Analyzing text...")
    text_predictions = analyze_modality(transcript_path, 'language')
    write_json_to_file(text_predictions, os.path.join(output_dir, "text_predictions.json"))
    
    print("Analyzing video...")
    video_predictions = analyze_modality(video_path, 'face')
    write_json_to_file(video_predictions, os.path.join(output_dir, "video_predictions.json"))
    
    print("API responses have been written to the output directory")

    # Synchronize and process the data
    print("Synchronizing and processing data...")
    synchronized_data = synchronize_data(audio_predictions, text_predictions, video_predictions)
    
    # Write synchronized data to a text file
    output_path = os.path.join(output_dir, "synchronized_emotions.txt")
    write_synchronized_data_to_file(synchronized_data, output_path)
    print(f"Synchronized emotion data has been written to {output_path}")

if __name__ == "__main__":
    main()
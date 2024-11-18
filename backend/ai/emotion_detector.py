import torch
import torch.nn as nn
import torchvision.transforms as transforms
from PIL import Image
import numpy as np
import cv2
import json
import argparse
import os

# Define your model architecture (should match your trained model)
class EmotionCNN(nn.Module):
    def __init__(self, num_classes=7):
        super(EmotionCNN, self).__init__()
        
        self.conv1 = nn.Conv2d(1, 64, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(64)
        self.conv2 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(128)
        self.conv3 = nn.Conv2d(128, 256, kernel_size=3, padding=1)
        self.bn3 = nn.BatchNorm2d(256)
        
        self.pool = nn.MaxPool2d(2, 2)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.5)
        
        # Calculate the size after convolutions and pooling
        self.fc1 = nn.Linear(256 * 6 * 6, 512)
        self.fc2 = nn.Linear(512, num_classes)
        
    def forward(self, x):
        x = self.pool(self.relu(self.bn1(self.conv1(x))))
        x = self.pool(self.relu(self.bn2(self.conv2(x))))
        x = self.pool(self.relu(self.bn3(self.conv3(x))))
        
        x = x.view(-1, 256 * 6 * 6)
        x = self.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.fc2(x)
        return x

def preprocess_image(image_path):
    # Read image
    image = cv2.imread(image_path)
    
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Face detection
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)
    
    if len(faces) == 0:
        return None
        
    # Get the largest face
    max_area = 0
    max_face = None
    for (x, y, w, h) in faces:
        if w * h > max_area:
            max_area = w * h
            max_face = (x, y, w, h)
    
    x, y, w, h = max_face
    face_img = gray[y:y+h, x:x+w]
    
    # Resize to match model input size
    face_img = cv2.resize(face_img, (48, 48))
    
    # Convert to PIL Image
    face_img = Image.fromarray(face_img)
    
    # Define transforms
    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485], std=[0.229])
    ])
    
    # Apply transforms
    face_tensor = transform(face_img)
    face_tensor = face_tensor.unsqueeze(0)  # Add batch dimension
    
    return face_tensor

def get_emotion(model, image_tensor, emotion_map):
    model.eval()
    with torch.no_grad():
        outputs = model(image_tensor)
        _, predicted = torch.max(outputs, 1)
        emotion_idx = predicted.item()
        emotion = emotion_map[emotion_idx]
        
        # Get confidence scores
        probabilities = torch.nn.functional.softmax(outputs, dim=1)
        confidence = probabilities[0][emotion_idx].item()
        
        return emotion, confidence

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--image', required=True, help='Path to input image')
    parser.add_argument('--model', required=True, help='Path to trained model')
    args = parser.parse_args()
    
    # Define emotion mapping
    emotion_map = {
        0: 'angry',
        1: 'disgust',
        2: 'fear',
        3: 'happy',
        4: 'sad',
        5: 'surprise',
        6: 'neutral'
    }
    
    try:
        # Load model
        model = EmotionCNN()
        model.load_state_dict(torch.load(args.model, map_location=torch.device('cpu')))
        
        # Preprocess image
        image_tensor = preprocess_image(args.image)
        if image_tensor is None:
            result = {'emotion': 'neutral', 'confidence': 0.0, 'error': 'No face detected'}
        else:
            # Get emotion prediction
            emotion, confidence = get_emotion(model, image_tensor, emotion_map)
            result = {'emotion': emotion, 'confidence': confidence}
        
        # Print result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {'emotion': 'neutral', 'confidence': 0.0, 'error': str(e)}
        print(json.dumps(error_result))
        return 1
    
    return 0

if __name__ == '__main__':
    exit(main())
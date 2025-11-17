import pandas as pd
from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer, TrainingArguments
from sklearn.model_selection import train_test_split
import torch

class CustomDataset(torch.utils.data.Dataset):
    def __init__(self, encodings, labels):
        self.encodings = encodings
        self.labels = labels

    def __getitem__(self, idx):
        item = {key: torch.tensor(val[idx]) for key, val in self.encodings.items()}
        item['labels'] = torch.tensor(self.labels[idx]).long()
        return item

    def __len__(self):
        return len(self.labels)

def train_model():
    # 1. 데이터 불러오기 및 전처리
    df = pd.read_csv('./data/train.csv')
    df.dropna(inplace=True) # 비어있는 행 제거
    df['label'] = df['label'].astype(int) # label을 정수형으로 변환
    
    texts = df['text'].tolist()
    labels = df['label'].tolist()
    train_texts, val_texts, train_labels, val_labels = train_test_split(texts, labels, test_size=0.2)

    # 2. 토크나이저 및 모델 준비
    model_name = "klue/bert-base"
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=5)

    # 3. 데이터 토큰화
    train_encodings = tokenizer(train_texts, truncation=True, padding=True)
    val_encodings = tokenizer(val_texts, truncation=True, padding=True)
    train_dataset = CustomDataset(train_encodings, train_labels)
    val_dataset = CustomDataset(val_encodings, val_labels)

    # 4. 모델 학습 실행
    training_args = TrainingArguments(
        output_dir='./results',
        num_train_epochs=5,
        per_device_train_batch_size=8,
        logging_dir='./logs',
    )
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset
    )
    trainer.train()

    # 5. 학습 완료된 모델 저장
    model.save_pretrained("./saved_model")
    tokenizer.save_pretrained("./saved_model")
    print("학습 완료! 모델이 'saved_model' 폴더에 저장되었습니다.")

if __name__ == "__main__":
    train_model()

import torch
import torch.nn as nn


class SelfAttention(nn.Module):
    """Simple self-attention over temporal dimension."""

    def __init__(self, hidden_size):
        super().__init__()
        self.attn = nn.Linear(hidden_size, 1)

    def forward(self, x):
        # x: (batch, time, features)
        weights = torch.softmax(self.attn(x), dim=1)  # (batch, time, 1)
        return (x * weights).sum(dim=1)  # (batch, features)


class CNN_GRU(nn.Module):
    def __init__(self):
        super().__init__()

        # ---------- CNN Feature Extractor (deeper) ----------
        self.cnn = nn.Sequential(
            nn.Conv2d(1, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.MaxPool2d((2, 1)),

            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d((2, 1)),

            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(),
            nn.MaxPool2d((2, 1)),

            nn.Conv2d(128, 256, kernel_size=3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(),
        )

        # Adaptive pooling to reduce frequency dim to a fixed size
        self.freq_pool = nn.AdaptiveAvgPool2d((1, None))
        # Output: (batch, 256, 1, time) → squeeze → (batch, 256, time)

        # ---------- BiGRU (2 layers) ----------
        self.gru = nn.GRU(
            input_size=256,
            hidden_size=128,
            num_layers=2,
            batch_first=True,
            bidirectional=True,
            dropout=0.3
        )

        # ---------- Temporal Attention ----------
        self.attention = SelfAttention(256)  # 128*2 bidirectional

        # ---------- FC Head ----------
        self.head = nn.Sequential(
            nn.LayerNorm(256),
            nn.Dropout(0.4),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 1),
        )

    def forward(self, x):
        # x: (batch, 1, 120, 200)
        x = self.cnn(x)
        # x: (batch, 256, freq_reduced, time)

        # Pool frequency dimension to 1
        x = self.freq_pool(x)  # (batch, 256, 1, time)
        x = x.squeeze(2)       # (batch, 256, time)

        # (batch, time, features) for GRU
        x = x.permute(0, 2, 1)

        # BiGRU
        gru_out, _ = self.gru(x)  # (batch, time, 256)

        # Attention pooling over time
        attended = self.attention(gru_out)  # (batch, 256)

        # FC head
        out = self.head(attended)

        # Bounded regression [0, 1]
        return torch.sigmoid(out).squeeze()
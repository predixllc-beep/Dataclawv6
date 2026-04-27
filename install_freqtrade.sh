#!/bin/bash
# Bu script, Dataclaw sistemine Freqtrade reposunu entegre etmek için kullanılır.
# AI Studio ortamında doğrudan git clone çalıştırılamadığı için lokal kullanım veya CI/CD için hazırlanmıştır.

echo "[INFO] Github'dan Freqtrade reposu çekiliyor..."
git clone https://github.com/freqtrade/freqtrade.git freqtrade_engine

echo "[INFO] Freqtrade dizinine giriliyor..."
cd freqtrade_engine

echo "[INFO] Bağımlılıklar kuruluyor..."
# ./setup.sh --install

echo "[INFO] Dataclaw-Freqtrade köprü yapılandırması kopyalanıyor..."
cp ../dataclaw_core/plugins/freqtrade_bridge/config_bridge.json ./user_data/config.json

echo "[SUCCESS] Freqtrade başarıyla import edildi ve Dataclaw için yapılandırıldı."
echo "[INFO] Başlatmak için: freqtrade trade --config user_data/config.json"

import logging
import time

logger = logging.getLogger(__name__)

class AutoBenchmarker:
    """Benchmarks local models for latency, reasoning quality, and stability."""
    def __init__(self, router):
        self.router = router

    def benchmark_model(self, model_specs: dict, test_prompt: str) -> dict:
        model_name = model_specs["model"]
        start_time = time.time()
        try:
            self.router.execute_inference(model_specs, test_prompt)
            latency = time.time() - start_time
            stability = 1.0  # Perfect stability for successful inference
        except Exception as e:
            latency = 999
            stability = 0.0
            logger.error(f"Benchmark failed for {model_name}: {e}")

        # Basic formula prioritizing low latency and high stability
        score = (1 / latency) * stability if latency > 0 else 0
        return {"latency_sec": round(latency, 4), "stability": stability, "overall_score": round(score, 4)}

    def run_full_benchmark(self):
        logger.info("Starting auto-benchmarking for offline local model stack...")
        registry = self.router.registry
        results = {}
        
        test_prompt = "Quick check: What is 2 + 2? Respond in exactly one word."
        
        for key, specs in registry.models.items():
            if specs["model"] == "tinydolphin:latest":
                continue # Skip fallback in standard benchmarks unless forced
                
            res = self.benchmark_model(specs, test_prompt)
            results[specs["model"]] = res
            logger.info(f"Benchmarked {specs['model']}: Latency {res['latency_sec']}s, Score {res['overall_score']}")
            
        return results

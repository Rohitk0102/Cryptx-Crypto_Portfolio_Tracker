"""Performance benchmarks for matching engine."""

import time
from decimal import Decimal
from datetime import datetime
from statistics import mean, stdev

from matching_engine.core.engine import MatchingEngine
from matching_engine.core.models import Order, OrderType, Side, OrderStatus


def create_order(order_id, order_type, side, quantity, price=None):
    """Helper to create orders."""
    return Order(
        order_id=order_id,
        symbol="BTC-USDT",
        order_type=order_type,
        side=side,
        quantity=Decimal(str(quantity)),
        price=Decimal(str(price)) if price else None,
        timestamp=datetime.utcnow(),
        remaining_quantity=Decimal(str(quantity))
    )


def benchmark_order_processing_latency(num_orders=1000):
    """
    Benchmark order processing latency.
    Target: <5ms average latency
    """
    print(f"\n=== Order Processing Latency Benchmark ({num_orders} orders) ===")
    
    engine = MatchingEngine()
    latencies = []
    
    # Pre-populate order book
    for i in range(100):
        sell = create_order(f"SELL-{i}", OrderType.LIMIT, Side.SELL, 1.0, 50000 + i)
        engine.process_order(sell)
    
    # Benchmark order processing
    for i in range(num_orders):
        buy = create_order(f"BUY-{i}", OrderType.LIMIT, Side.BUY, 1.0, 49000 + i)
        
        start = time.perf_counter()
        engine.process_order(buy)
        end = time.perf_counter()
        
        latencies.append((end - start) * 1000)  # Convert to ms
    
    avg_latency = mean(latencies)
    p99_latency = sorted(latencies)[int(len(latencies) * 0.99)]
    
    print(f"Average latency: {avg_latency:.3f}ms")
    print(f"P99 latency: {p99_latency:.3f}ms")
    print(f"Target: <5ms average")
    print(f"Status: {'PASS' if avg_latency < 5 else 'FAIL'}")
    
    return avg_latency


def benchmark_throughput(duration_seconds=10):
    """
    Benchmark order throughput.
    Target: >1000 orders/sec
    """
    print(f"\n=== Order Throughput Benchmark ({duration_seconds}s) ===")
    
    engine = MatchingEngine()
    order_count = 0
    
    start_time = time.time()
    end_time = start_time + duration_seconds
    
    while time.time() < end_time:
        order = create_order(
            f"ORD-{order_count}",
            OrderType.LIMIT,
            Side.BUY if order_count % 2 == 0 else Side.SELL,
            1.0,
            50000 + (order_count % 100)
        )
        engine.process_order(order)
        order_count += 1
    
    actual_duration = time.time() - start_time
    throughput = order_count / actual_duration
    
    print(f"Orders processed: {order_count}")
    print(f"Duration: {actual_duration:.2f}s")
    print(f"Throughput: {throughput:.0f} orders/sec")
    print(f"Target: >1000 orders/sec")
    print(f"Status: {'PASS' if throughput > 1000 else 'FAIL'}")
    
    return throughput


if __name__ == "__main__":
    print("Starting Performance Benchmarks...")
    
    # Run benchmarks
    avg_latency = benchmark_order_processing_latency(1000)
    throughput = benchmark_throughput(10)
    
    print("\n=== Summary ===")
    print(f"Average Latency: {avg_latency:.3f}ms (target: <5ms)")
    print(f"Throughput: {throughput:.0f} orders/sec (target: >1000)")

from setuptools import setup, find_packages

setup(
    name="crypto-matching-engine",
    version="0.1.0",
    description="High-performance cryptocurrency matching engine with REG NMS-inspired price-time priority",
    author="Crypto Matching Engine Team",
    python_requires=">=3.11",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    install_requires=[
        "fastapi>=0.104.1",
        "uvicorn[standard]>=0.24.0",
        "websockets>=12.0",
        "sortedcontainers>=2.4.0",
        "pydantic>=2.5.0",
        "pydantic-settings>=2.1.0",
        "structlog>=23.2.0",
        "python-dotenv>=1.0.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.4.3",
            "pytest-asyncio>=0.21.1",
            "pytest-cov>=4.1.0",
            "httpx>=0.25.2",
        ],
    },
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Financial and Insurance Industry",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
)

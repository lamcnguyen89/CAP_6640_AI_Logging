#!/bin/bash -e
docker run --rm -v $(pwd)/docs/sections:/docs/sections -v $(pwd)/docs/_images:/docs/_images  -v $(pwd)/static/docs:/docs/_build/html sphinx-docs-builder
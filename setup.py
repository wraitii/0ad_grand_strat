#!/usr/bin/env python3

"""setup.py for Grand Strategy tools."""

from setuptools import find_packages, setup

setup(
    name='0 A.D. Grand Strategy tools',
    version='1.0',
    description='Custom tools to make or edit 0 A.D. Grand Strategy style campaigns.',
    packages=find_packages(),
    install_requires=open("requirements.txt").read().split("\n"),
    classifiers=[
        'Development Status :: 3 - Alpha',
        'License :: OSI Approved :: GNU General Public License v2 or later (GPLv2+)',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Topic :: Games/Entertainment',
    ],
)

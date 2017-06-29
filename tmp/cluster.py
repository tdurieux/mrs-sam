print(__doc__)

import numpy as np
import pandas 

from sklearn.cluster import DBSCAN
from sklearn import metrics
from sklearn.datasets.samples_generator import make_blobs
from sklearn.preprocessing import StandardScaler


X = pandas.read_csv("./metrics_data.csv", header=None)
X = StandardScaler().fit_transform(X)
db = DBSCAN(eps=0.8, min_samples=2).fit(X)

core_samples_mask = np.zeros_like(db.labels_, dtype=bool)
core_samples_mask[db.core_sample_indices_] = True
labels = db.labels_

print('Labels %s' %db.labels_)

# Number of clusters in labels, ignoring noise if present.
n_clusters_ = len(set(labels)) - (1 if -1 in labels else 0)

print('Estimated number of clusters: %d' % n_clusters_)
print("Silhouette Coefficient: %0.3f" % metrics.silhouette_score(X, labels))

######
# create dir
######
import os
import shutil
oids = pandas.read_csv("./metrics_ids.csv", header=None)
i = 0
for label in labels:
	mypath = './%d' %label
	if not os.path.isdir(mypath):
		os.makedirs(mypath)
	source = './img/%s.png' %oids.iloc[0,i]
	print('source:%s' %source)
	target = '%s/%s.png' % (mypath,oids.iloc[0,i])
	print('target:%s' %target)
	shutil.copyfile(source, target)
	i = i + 1


Data Management
=================

There are a variety of ways you can view, download, and manage recorded experiment data in the VERA web portal.
This section provides a general overview of these data management features, and how to use them for your specific needs.

Before continuing, it may be useful to review the `Web Portal Overview <web_overview.html>`_ section to understand the general layout and features of the VERA web portal.

If you do not yet have a created experiment to view data for, you can refer to the `Experiments <experiments.html>`_ section to learn how to create one.
If you do not yet have any data recorded to your experiment, you can refer to the `Logging Data <logging_data.html>`_ section to learn how to log data from Unity into the VERA web portal.
You can also refer to the `Demo <demo.html>`_ section for a concrete demonstration of the VERA web portal in action.

The Experiment Results Table
-----------------------------

Once you have recorded data to your experiment, you can view it in the **Experiment Results** table.
From the dashboard, click on the experiment you wish to view data for; you will then be presented with the experiment's results table.

  .. image:: /_static/ExperimentResults.png
    :alt: Experiment Results Table
    :width: 500px
    :align: center

The Experiment Results table provides a high-level overview of the data recorded to your experiment.
Each row in the table represents a single participant session, each with the following columns:

- **Site**: The site where the participant session was recorded. Only appears if your experiment has multi-site support enabled (see the `Multi-Site Support <multi_site.html>`_ section).
- **Participant ID**: A short unique identifier for the participant session.
- **Timestamp**: The date and time when the participant session was recorded.
- **Status**: The participant's current status in the experiment. States include **Created**, **In Experiment**, **Complete**, **Incomplete**, and **Withdrawn**.
- **Data Files**: Provides a download button which can be used to download all data files associated with the participant.
- **File Size**: The total size of all data files associated with the participant (in Megabytes).
- **View Logs**: Provides a "View" button which can be used to view the participant's logs in the VERA web portal.

At the top of the page is additionally a **Download Data** button. Pressing this button will download the entire experiment's data as a ZIP file, containing all participant data files and logs.

If your site has multi-site support enabled, you can also filter the results table by site using the **Site Filter** dropdown at the top of the page.
This dropdown will not appear if you do not have multi-site support enabled (see the `Multi-Site Support <multi_site.html>`_ section).

Viewing Individual Participant Results
-----------------------------------------

The VERA portal additionally provides a way to directly view the results of an individual participant session.
From the experiment results table, click the **View** button for a particular participant session;
you will then be presented with the participant's results page.

  .. image:: /_static/ParticipantResults.png
    :alt: Participant Results Page
    :width: 500px
    :align: center

The participant results page provides a detailed view of the data recorded for an individual participant.
At the top of the page, you can see the ID of the participant you are currently viewing.

On the left, you will see a list of all data files associated with the participant session.
For each file, you can see when the file was last updated, as well as the file size.
If a file has never been uploaded, it will be marked as such.

Clicking on an individual file will open a preview window on the right side of the page.
This preview window will display the contents of the file in a human-readable format, if possible.
For example, CSV files will be displayed as a formatted table.
If the file is not in a human-readable format, or is otherwise not supported by the VERA preview system, a message will be displayed indicating such.

Individual files can be downloaded by clicking the **Download File** button at the top-right of the file preview window.
The entirety of the participant's data can be downloaded as a ZIP file by clicking the **Download Participant** button at the top of the page.
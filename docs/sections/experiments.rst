Experiment Management
======================

This section provides an in-depth guide on creating and managing experiments in the VERA web portal.

Before continuing, it may be useful to review the `Web Portal Overview <web_overview.html>`_ section to understand the general layout and features of the VERA web portal.
If you wish to see a concrete demonstration of the VERA web portal in action, you can refer to the `Demo <demo.html>`_ section.

Creating or Editing an Experiment
-----------------------------

1. From the dashboard, click the **Create New Experiment** button.

   .. image:: /_static/CreateExperiment.png
      :alt: Create Experiment button
      :width: 400px
      :align: center

2. You will be taken to a new page with some high-level experiment instructions. Click **Next** to proceed.

   .. image:: /_static/ExperimentInstructions.png
      :alt: Experiment Instructions
      :width: 400px
      :align: center

3. You will then be taken to a page where you can configure your experiment information. 

   .. image:: /_static/ExperimentCreationPage.png
      :alt: Experiment creation page
      :width: 400px
      :align: center

If you have an existing experiment you wish to edit, you can instead click the **Edit Experiment** button next to the experiment you wish to modify on the dashboard. This will bring you to the same page as that outlined above.

Experiment Configuration: General Metadata
-------------------------------------------

The first step in configuring your experiment is to fill out the general high-level metadata fields. These fields represent more standard information about your experiment, such as the name and description.

  .. image:: /_static/ExperimentMetadata.png
    :alt: The experiment metadata fields
    :width: 500px
    :align: center

The associated metadata fields are as follows:

- **Experiment Name**: A unique name for your experiment. No two experiments across the VERA system can have the same name. To ensure global uniqueness, consider appending an email address or another unique identifier to the experiment name.
- **Experiment Description**: A brief description of your experiment. This can be used to provide context for the experiment and its goals.
- **IRB Protocol Number**: The number assigned to your experiment by the Institutional Review Board (IRB).
- **IRB Email Address**: The email address of the IRB that approved your experiment.
- **IRB Approval Letter**: An upload field for your experiment's IRB approval letter.

In order to finalize an experiment, all of these metadata fields must be filled out. If you do not yet have an IRB approval, 
or otherwise do not wish to fill out all the metadata fields, you can leave sections blank or unfinished and save your experiment in **draft state**. 
An experiment in draft state cannot have data recorded to it, nor can it be used in a formal experiment context by the Unity plugin.
You may later come back and finalize a draft experiment by filling out the remaining metadata fields and clicking the **Finalize Experiment** button.

Experiment Configuration: Participant File Management
------------------------------------------------------

The next step in configuring your experiment is to define what files you want to record data to per-participant.

  .. image:: /_static/ParticipantFileManagement.png
    :alt: Participant file management section
    :width: 500px
    :align: center

In order to record data to a participant, you must first describe what format that data will be recorded in. 
This is done by creating a **File Type**. 
A file type describes the format of the data that will be recorded. Each participant in your experiment can have a single file associated with each of the experiment's defined file type.

Every file type has a name, as well as an extension. You may choose from a wide variety of file extensions, such as PNG, CSV, JSON, and more.
The data recorded to a file of a given type will be formatted according to the file type's extension.

For example, let's say you want to record a PNG file for a participant which contains a headshot of that participant, for use when cross-referencing the participant with their virtual avatar.
In this case, you could create a file type called "Headshot" with the extension ".png".
When you record data to a participant's headshot file, it will be saved as a PNG image.
Every participant in your experiment would have a single headshot file associated with them, which can be used to store their headshot image.

To create a new file type, click the **Add New File** button.

  .. image:: /_static/CreateFileType.png
    :alt: Creating a new file type
    :width: 500px
    :align: center

In this dialogue, you can define the **Filename** associated with the file, a **Description** of the file, and the **Extension** of the file.

Experiment Configuration: CSV File Types
-------------------------------------------------

VERA provides extra support for a special type of file, the **CSV File**. CSV files are a standard form of data storage that can be used to record tabular data.
These files are particularly useful for recording data from experiments, as they can be easily read and processed by a wide variety of tools.
One of the primary features of the VERA Unity plugin is seamless integration with CSV files, allowing you to easily record and export data in this format.

To begin using CSV files in your experiment, you must first create a CSV file type. To begin creating a CSV file type, begin creating a new file type as described above.
When creating the file type, input **CSV** as the file extension.

  .. image:: /_static/CsvFileType.png
    :alt: Creating a new CSV file type
    :width: 500px
    :align: center

Once you input **CSV** as the extension, an extra section titled **CSV Column Metadata Configuration** will appear.
It is in this area that you can define the columns that will be present in the CSV file.

CSV files have **columns**, each representing a different piece of data that will be recorded for each participant, and **rows**, each representing a single entry of that data.
For example, let's say you wanted to record the transform of a participant's hand controllers throughout the course of an experiment, recording one entry every frame.
In this case, you would create a CSV file with a column for the *Transform*, with each row entry representing a single frame of logged transform data.

To create a new column, input the **Column Name**, **Data Type**, and **Column Description**. Then, click the **Add Column** button.
The newly created column will populate in the tabular list of columns below.
You can use this tabular list to view, edit, reorder, and delete columns as needed.

Note that two columns are required by default:

- **ts**: The timestamp of the entry, including the date and time down to the second. This timestamp will be handled automatically by the VERA Unity plugin, and does not need to be manually recorded.
- **eventId**: A unique identifier for the event that this entry represents. This is an integer value, the meaning of which you may define for your personal needs. For example, maybe for the example above on logging hand controller transforms, you would define an eventId of 1 for the left hand controller and 2 for the right hand controller.

Any other columns may be defined as you wish to fit your particular experiment's needs. Columns come in a variety of data types, including strings, integers, floats, transforms, and more.

These CSV files are handled by the VERA Unity plugin, which provides special features for recording and uploading CSV data for a participant during the course of an experiment.
See the `Logging Data <logging_data.html>`_ section for more information on how to use the VERA Unity plugin to record and upload CSV data for a participant.

Experiment Configuration: Final Steps
--------------------------------------

There are three more sections before the experiment is ready to be finalized.

  .. image:: /_static/ExperimentFinalSteps.png
    :alt: Final steps in experiment configuration
    :width: 500px
    :align: center

- **Collaborators**: This section allows you to manage any collaborators on your experiment. You can search users by their email address, and add them directly as collaborators to the experiment. For more details on managing collaborators, see the `Collaborators <collaborators.html>`_ section.
- **Multi-Site Support**: This section allows you to configure whether your experiment is recording data from multiple separate sites, and define what those sites are. For more details on managing multi-site experiments, see the `Multi-Site <multi-site.html>`_ section.
- **WebXR Link**: This section will be used later after you have built and uploaded your experiment for WebXR to the VERA portal. Once WebXR has been properly set up, this is where your WebXR link will be displayed. For more details on WebXR, see the `WebXR Guide <webxr.html>`_.

Once you are ready, you can either choose to **Save as Draft** or **Submit** the experiment. Saving as a draft will allow you to come back later and finish configuring the experiment; 
an experiment draft cannot have data recorded to it, nor can it be used in a formal experiment context by the Unity plugin.
Submitting an experiment will finalize it, allowing it to be used in a formal experiment context.

And that's all there is to it! You have now created and configured your experiment in the VERA web portal.
For more details on using this experiment, refer to the `Logging Data <logging_data.html>`_ section, which provides a guide on how to use the VERA Unity plugin to log data to your experiment.
Once you have successfully logged data, see the `Data Management <data_management.html>`_ section for a guide on how to view and manage the data you have collected in your experiment.
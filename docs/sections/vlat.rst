The VERA Locomotion Accessibility Toolkit (VLAT)
================================================
Overview
--------

The VERA Locomotion Accessibility Toolkit (abbreviated VLAT) is a set of Unity tools designed to aid in providing locomotive and mobility accessibility to VR study participants with locomotive or mobility disabilities (such as quadriplegia, cerebral palsy, muscular dystrophy, etc.).

The toolkit’s primary approach to provide locomotive and mobility accessibility is through use of the **VLAT Menu**, an in-game UI display provided to participants with disabilities. This menu aims to allow the disabled participant to fully navigate and interact with their environment, all through the use of four binary (on/off) inputs (defaultly mapped to **1**, **2**, **3**, and **4** on a computer keyboard, or **X**, **Y**, **A**, and **B** on VR controllers). In this way, the participant will not be required to have control of their neck (e.g., make use of head tracking), their hands (e.g., make use of hand tracking), or their legs (e.g., make use of physical traversal and body tracking), so long as they are able to operate four binary inputs.

The VLAT Menu
-------------

The VLAT Menu is divided into four distinct categories, one for **Look** (manually adjusting camera angle to view the environment without use of head tracking), **Move** (traversing the environment without use of body tracking or complex controller inputs), **Interact** (interacting with nearby interactable objects, such as a grabbable object or door, without use of hand tracking), and **Settings** (adjusting various accessibility options).

The menu is navigated with four binary inputs (defaultly mapped to **1**, **2**, **3**, and **4** on a computer keyboard, or **X**, **Y**, **A**, and **B** on VR controllers), using modified “tab-enter” controls (highlight previous menu item, highlight next menu item, select currently highlighted menu item, go back to previous submenu).

.. image:: /_static/34.png
   :alt: Example
   :width: 300px
   :align: center

Setup & Provide the VLAT Menu
-----------------------------

The toolkit’s tools may be found in the **VERA -> VLAT_LocomotionAccessibilityToolkit** folder.

In order to set up the VLAT Menu, simply attach the **VLAT_Menu** prefab (located in the VLAT_LocomotionAccessibilityToolkit folder) as a child game object of a scene’s main camera. 

Below is the VLAT Menu as can be found in the folder view, followed by an example hierarchy for a setup which uses the XR Interaction Toolkit (any VR provider of choice may be used). 

.. image:: /_static/35.png
   :alt: Example
   :width: 300px
   :align: center

-----------------------------

.. image:: /_static/36.png
   :alt: Example
   :width: 300px
   :align: center


Once the VLAT Menu has been added as a child object of the main camera, select the newly added VLAT Menu game object to begin inspecting it. In the inspector, set up the **VLAT_Options** script component. This script component provides various options for how the VLAT Menu will be displayed. 

These options are as follows:

- **XR Player Parent**: A reference to the parent game object of your XR player. For example, in the XR Interaction Toolkit, this is most commonly the **XR Origin** game object.
- **XR Player Radius**: The XR player’s collision radius, when moving with accessible controls.
- **XR Player Height**: The XR player’s collision height, when moving with accessible controls.
- **Player Move Speed**: The XR player’s default speed, when moving with accessible controls.
- **Interaction Radius**: The maximum distance a player may be from an interactable object and still be able to interact with it, when interacting with accessible controls.
- **Player Has Virtual Hands**: Whether or not the XR player has virtual hands (e.g., whether or not your XR rig features visible virtual hands or controllers).
- **Left Virtual Hand / Right Virtual Hand**: A reference to your XR rig’s virtual hands. Only required if “Player Has Virtual Hands” is true.

Below is an inspector which shows example values for the VLAT_Options component. 

.. image:: /_static/37.png
   :alt: Example
   :width: 300px
   :align: center

Once these steps have been completed, the project may be run, and the VLAT Menu may be used by disabled participants to look around, move within, and interact with their environment.

If you check the **Show Setup on Start** checkbox in the VLAT_Options component, an accessibility setup guide will be provided to participants upon beginning your experiment. This setup includes a brief participant-facing explanation of the tools, as well as the affordance for allowing the participant to rebind their controls, if they are using a custom accessible external device (e.g., sip-and-puff, head array, etc.).

Creating Interactable Objects
-----------------------------

In order for participants to be able to interact with the various interactable objects in your scene (e.g., a grabbable object, a door, a button, etc.), the objects must be marked as interactable.

To mark an object as interactable, first select it to begin inspecting the object. In the inspector, add the **VLAT_Interactable** script component to the object.

This component will provide various options for how the object may be interacted with. Firstly, fill out the **Interactable Name** field with the name of this object. For example, an interactable door which opens to the front yard might be called “Front door”. This name is what will be directly shown to the participant when interacting with the object.

Next, add any desired interactions to the **Interactions** list by pressing the **+** button in the bottom right corner of the list. For each interaction, provide an **Interaction Name** for the interaction (such as **Grab**, **Press**, **Open**).

In the **On Trigger Interaction** area, add any desired functions you wish to be run when this interaction is performed. You can do so by clicking the **+** in the bottom right of the area, select your desired script, and use the dropdown to select your desired function.

Several common interactions have been provided to you by default, each with their own associated script component. These scripts are as follows:

- **VLAT_GrabInteractable.cs**: Allows users to grab / drop an object, without needing to physically hold on to the object.
- **VLAT_DoorInteractable.cs**: Allows users to open / close a hinged door, without needing to physically open the door.
- **VLAT_DrawerInteractable.cs**: Allows users to open / close a jointed drawer, without needing to physically open the drawer.

If you wish to use one of these scripts, add the corresponding script component to the object, and select the corresponding function for the desired interaction. For example, if you wanted a **Grab/Drop** interaction, add the **VLAT_GrabInteractable** script to the game object, then add a reference to the **GrabAndRelease** function of the script as an interaction of the **VLAT_Interactable**.

Once this information has been provided, the object may be interacted with using accessible controls via the VLAT Menu. Below is an example interactable object’s inspector, set up to allow the object to be grabbed and dropped (via the VLAT_GrabInteractable script). 

.. image:: /_static/38.png
   :alt: Example
   :width: 300px
   :align: center

Accessible Menu Navigation
--------------------------

If you wish to provide the ability to navigate a menu with accessible controls, add the **VLAT_MenuNavigator** script component to your menu. This component will provide the ability for participants to navigate this menu using accessible modified “tab-enter” controls.

In the inspector of this component, use the **Ordered Menu Items** list to provide references to all interactable UI elements of this menu. Supported UI elements currently include buttons, toggles, and sliders. Provide references in linear order as the elements should be navigated (e.g., top-to-bottom, or left-to-right).

When you wish to allow a participant to begin navigating this menu, you may call the **StartMenuNavigation()** function of the **VLAT_MenuNavigator**. This will start navigation of the menu (most commonly, you may want to begin navigation of a menu when the menu is opened).

When you wish to allow a participant to stop navigating this menu, you may call the **StopMenuNavigation()** function of the **VLAT_MenuNavigator**. This will stop navigation of the menu (most commonly, you may want to stop navigation of a menu when the menu is closed).

Below is an example setup of the VLAT_MenuNavigator component, for a menu with 8 items. 

.. image:: /_static/39.png
   :alt: Example
   :width: 300px
   :align: center